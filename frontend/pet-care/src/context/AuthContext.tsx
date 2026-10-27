import React, { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import { loginRequest, registerRequest, logoutRequest, getProfileRequest } from '../api/auth.api';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { tokenStorage } from '../utils/storage';

export interface User {
  [key: string]: unknown;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  [key: string]: unknown;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: User | null;
}

type AuthAction =
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'UPDATE_USER'; user: Partial<User> }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_FAILED' };

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = {
  status: 'loading', // 'loading' | 'authenticated' | 'unauthenticated'
  user: null,
};

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return { status: 'authenticated', user: action.user };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.user } };
    case 'LOGOUT':
    case 'RESTORE_FAILED':
      return { status: 'unauthenticated', user: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const clearSession = useCallback(async (): Promise<void> => {
    setAuthToken(null);
    await tokenStorage.remove();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const startSession = useCallback(async ({ user, accessToken }: AuthSession): Promise<void> => {
    await tokenStorage.set(accessToken);
    setAuthToken(accessToken);
    dispatch({ type: 'AUTH_SUCCESS', user });
  }, []);

  const authenticate = useCallback(async ({ email, password }: AuthCredentials): Promise<void> => {
    const { token: accessToken } = await loginRequest({ email, password });
    setAuthToken(accessToken);
    try {
      const user = await getProfileRequest();
      await startSession({ user, accessToken });
    } catch (error) {
      setAuthToken(null);
      throw error;
    }
  }, [startSession]);

  // Restore session on app launch
  useEffect(() => {
    (async (): Promise<void> => {
      try {
        const token: string | null = await tokenStorage.get();
        if (!token) return dispatch({ type: 'RESTORE_FAILED' });
        setAuthToken(token);
        const user: User = await getMeRequest();
        dispatch({ type: 'AUTH_SUCCESS', user });
      } catch {
        await clearSession();
      }
    })();
  }, [clearSession]);

  // Expired/invalid token on any request -> back to login
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (credentials: AuthCredentials): Promise<void> => {
    await authenticate(credentials);
  }, [authenticate]);

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    await registerRequest(payload);
    await authenticate({ email: String(payload.email), password: String(payload.password) });
  }, [authenticate]);

  const updateUser = useCallback((updates: Partial<User>): void => {
    dispatch({ type: 'UPDATE_USER', user: updates });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout: clearSession, updateUser }),
    [state, login, register, clearSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function getMeRequest(): Promise<User> {
  return getProfileRequest();
}
