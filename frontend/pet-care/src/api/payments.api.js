import client from './client';

// Payment routes return data directly (no { data: ... } wrapper). Assumes the router
// is mounted at /payments; adjust BASE if yours differs.
const BASE = '/payments';

const toList = (body) => (Array.isArray(body) ? body : body?.payments ?? []);

// Send bookingId and method (required by backend). Backend accepts both camelCase and snake_case.
export const createPaymentRequest = async ({ bookingId, method = 'stripe' }) => (await client.post(BASE, { bookingId, method })).data;

export const getPaymentsRequest = async () => toList((await client.get(BASE)).data);
export const getPaymentRequest = async (paymentId) => (await client.get(`${BASE}/${paymentId}`)).data;

// Not used by the UI: a client must never be able to mark its own payment as paid.
// Paid/failed should come from the Stripe webhook on the server.
export const updatePaymentStatusRequest = async (paymentId, status) =>
  (await client.put(`${BASE}/${paymentId}/status`, { status })).data;

export const refundPaymentRequest = async (paymentId) => (await client.post(`${BASE}/${paymentId}/refund`)).data;