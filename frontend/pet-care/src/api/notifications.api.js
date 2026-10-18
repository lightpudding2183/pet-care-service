import client from './client';

const BASE = '/notification';

const toList = (body) => (Array.isArray(body) ? body : body?.notifications ?? []);

export const createNotificationRequest = async (payload) => (await client.post(BASE, payload)).data;
export const getNotificationsRequest = async () => toList((await client.get(BASE)).data);
export const markNotificationReadRequest = async (notifId) => (await client.get(`${BASE}/${notifId}`)).data;
export const markAllNotificationsReadRequest = async () => (await client.put(`${BASE}/read-all`)).data;
export const deleteNotificationRequest = async (notifId) => (await client.delete(`${BASE}/${notifId}`)).data;
export const getUnreadCountRequest = async () => (await client.get(`${BASE}/unread/count`)).data;