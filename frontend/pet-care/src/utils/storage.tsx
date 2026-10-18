import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { TOKEN_KEY } from '../config';

const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  get: async (): Promise<string | null> => {
    if (isWeb) {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  
  set: async (token: string): Promise<void> => {
    if (isWeb) {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
  },
  remove: async (): Promise<void> => {
    if (isWeb) {
      localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};