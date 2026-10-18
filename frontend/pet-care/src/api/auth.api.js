import client from './client';

export const registerRequest = async (payload) => {
  const res = await client.post('/auth/register', payload);
  return res.data;
};

export const loginRequest = async ({ email, password }) => {
  const res = await client.post('/auth/login', { email, password });
  return res.data;
};

export const logoutRequest = async () => {
  const res = await client.post('/auth/logout');
  return res.data;
};

export const getProfileRequest = async () => {
  const res = await client.get('/users/profile');
  return res.data;
};