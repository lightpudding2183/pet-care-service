import client from './client';

const BASE = '/review';

const toList = (body) => (Array.isArray(body) ? body : body?.reviews ?? []);

export const createReviewRequest = async (payload) => (await client.post(BASE, payload)).data;
export const getReviewsByProviderRequest = async (providerId) => toList((await client.get(`${BASE}/provider/${providerId}`)).data);
export const getAverageRatingRequest = async (providerId) => (await client.get(`${BASE}/provider/${providerId}/average`)).data;
export const getReviewsByUserRequest = async (bookingId) => toList((await client.get(`${BASE}/booking/${bookingId}`)).data);