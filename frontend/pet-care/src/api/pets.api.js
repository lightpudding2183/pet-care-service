import client from './client';

export const listPetsRequest = async () => {
  const res = await client.get('/pets');
  return res.data;
}
export const getPetRequest = async (id) => {
  const res = await client.get(`/pets/${id}`);
  return res.data;
}

export const createPetRequest = async (payload) => {
  const res = await client.post('/pets', payload);
  return res.data;
}

export const updatePetRequest = async (id, payload) => {
  const res = await client.put(`/pets/${id}`, payload);
  return res.data;
}

export const deletePetRequest = async (id) => { await client.delete(`/pets/${id}`); };