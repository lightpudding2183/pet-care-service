import client from './client';

// Booking routes return data directly (no { data: ... } wrapper). Assumes the
// router is mounted at /bookings; adjust BASE if yours differs.
const BASE = '/bookings';

const toList = (body) => (Array.isArray(body) ? body : body?.bookings ?? []);

// Convert camelCase to snake_case for backend compatibility
const toSnakeCase = (obj) => {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
};

export const createBookingRequest = async (payload) => {
  // Backend only accepts: provider_id, pet_id, start_time, end_time
  // user_id is added by backend from auth
  const backendPayload = toSnakeCase({
    providerId: payload.providerId,
    petId: payload.petId,
    scheduledStart: payload.scheduledStart,
    scheduledEnd: payload.scheduledEnd,
  });
  return (await client.post(BASE, backendPayload)).data;
};

export const getUserBookingsRequest = async (userId) => toList((await client.get(`${BASE}/users/${userId}/bookings`)).data);
export const getProviderBookingsRequest = async (providerId) => toList((await client.get(`${BASE}/providers/${providerId}/bookings`)).data);
export const getBookingRequest = async (id) => (await client.get(`${BASE}/${id}`)).data;

// Status changes (accept, start, complete, cancel) go through here: { status: 'confirmed' } etc.
export const updateBookingRequest = async (id, patch) => (await client.put(`${BASE}/${id}`, toSnakeCase(patch))).data;

// Not used by the UI: cancelling keeps the booking as history via PUT status=cancelled.
export const deleteBookingRequest = async (id) => { await client.delete(`${BASE}/${id}`); };