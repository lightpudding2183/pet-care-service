import client from './client';

// Provider routes return data directly (no { data: ... } wrapper).
export const getProviderRequest = async (id) => (await client.get(`/providers/${id}`)).data;
export const createProviderRequest = async (payload) => (await client.post('/providers', payload)).data;
export const updateProviderRequest = async (id, payload) => (await client.put(`/providers/${id}`, payload)).data;
export const searchProvidersRequest = async (filters = {}) =>
  (await client.get('/providers/search', { params: filters })).data;

// Assumed: GET returns an array of slots (also tolerates { slots: [...] })
export const getAvailabilityRequest = async (id) => {
  const body = (await client.get(`/providers/${id}/availability`)).data;
  return Array.isArray(body) ? body : body?.slots ?? [];
};

export const getProviderServicesRequest = async (id) => {
  const provider = await getProviderRequest(id);
  return provider.provider_services ?? provider.providerServices ?? [];
};

// Assumed: PUT replaces the provider's whole availability with the given slots
export const updateAvailabilityRequest = async (id, slots) => {
  await client.put(`/providers/${id}/availability`, { slots });
};

// Assumed: DELETE clears all of the provider's availability
export const clearAvailabilityRequest = async (id) => {
  await client.delete(`/providers/${id}/availability`);
};