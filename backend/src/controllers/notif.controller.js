const notifService = require('../services/notif.service');
const AppError = require('../utils/error');
const asyncHandler = require('../utils/asyncHandler');

const createNotif = asyncHandler(async (req, res) => {
  const { type, payload_json } = req.body;
  const notif = await notifService.createNotif({ user_id: req.user.id, type, payload_json });
  res.status(201).json(notif);
});

const getNotifsByUser = asyncHandler(async (req, res) => {
  const { read, type, page = 1, limit = 20 } = req.query;
  const filters = {};
  if (type) filters.type = type;
  if (read !== undefined) {
    if (read !== 'true' && read !== 'false') {
      throw new AppError('read must be true or false', 400);
    }
    filters.read = read === 'true';
  }
  const result = await notifService.getNotifsByUser(req.user.id, { ...filters, page, limit });
  res.status(200).json(result);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notif = await notifService.markAsRead(req.params.notifId, req.user.id);
  res.status(200).json(notif);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notifService.markAllAsRead(req.user.id);
  res.status(200).json({ message: 'All notifications marked as read' });
});

const deleteNotif = asyncHandler(async (req, res) => {
  const result = await notifService.deleteNotif(req.params.notifId, req.user.id);
  res.status(200).json(result);
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notifService.getUnreadCount(req.user.id);
  res.status(200).json({ count });
});

module.exports = { createNotif, getNotifsByUser, markAsRead, markAllAsRead, deleteNotif, getUnreadCount }