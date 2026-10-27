import axios from 'axios';
import { API_URL } from '../config';

let authToken = null;
let unauthorizedHandler = null;

// Called by AuthContext so the client never imports React state (avoids circular deps)
export const setAuthToken = (token) => { authToken = token; };
export const setUnauthorizedHandler = (fn) => { unauthorizedHandler = fn; };

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const responseData = err.response?.data;
    // Only force logout if we had a session; a failed login also returns 401
    if (status === 401 && authToken && unauthorizedHandler) unauthorizedHandler();

    return Promise.reject({
      status: status ?? null,
      message: responseData?.message 
        || [responseData?.error, ...(responseData?.details || [])].filter(Boolean).join(' ') 
        || (err.response ? `Request failed (${status})` : err.request ? 'Cannot reach the server. Check your connection.' : 'Something went wrong'),
      fieldErrors: responseData?.errors || null, // e.g. { email: 'Already in use' }
    });
  }
);

export default client;