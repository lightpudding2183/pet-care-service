const AppError = require('../utils/error');
const notifService = require('../services/notif.service');

async function createNotif(req, res) {
  try {
    const { type, payload_json } = req.body;
    const userId = req.user.id;

    const notif = await notifService.createNotif({
      user_id: userId,
      type,
      payload_json
    });

    res.status(201).json(notif);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getNotifsByUser(req, res) {
  try {
    const userId = req.user.id;
    const { read, type, page = 1, limit = 20 } = req.query;
    const filters = {};

    if (type) filters.type = type;
    if (read !== undefined) filters.read = JSON.parse(read);

    const result = await notifService.getNotifsByUser(userId, {
      ...filters,
      page,
      limit
    });

    res.status(200).json(result)
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function markAsRead(req, res) {
  try {
    const notifId = req.params.notifId;
    const notif = await notifService.markAsRead(notifId);
    res.status(200).json(notif);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    await notifService.markAllAsRead(userId);
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  } 
}

async function deleteNotif(req, res) {
  try {
    const notifId = req.params.notifId;
    const result = await notifService.deleteNotif(notifId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const count = await notifService.getUnreadCount(userId);
    res.status(200).json({ count });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = { createNotif, getNotifsByUser, markAsRead, markAllAsRead, deleteNotif, getUnreadCount }