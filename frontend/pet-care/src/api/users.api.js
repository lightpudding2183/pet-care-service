import client from './client';

export const updateProfileRequest = async (payload) => {
  const res = await client.put('/users/profile', payload);
  return res.data;
};

export const createAvatarUploadUrlRequest = async (contentType) => {
  const res = await client.post('/users/avatar-upload-url', { contentType });
  return res.data;
};

export const uploadAvatarRequest = async (uploadUrl, uri, contentType) => {
  const image = await fetch(uri);
  const imageBlob = await image.blob();
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: imageBlob,
  });

  if (!response.ok) throw new Error('Unable to upload avatar');
};