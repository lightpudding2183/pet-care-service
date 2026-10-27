const { Op } = require('sequelize');
const { Notification } = require('../index');
const AppError = require('../utils/error');

class NotifService {
  async createNotif(notifData, { transaction } = {}) {
    try {
      const { user_id, type, payload_json } = notifData;

      if(!user_id || !type) {
        throw new AppError('Missing required fields', 400)
      }
      const notif = await Notification.create({
        user_id,
        type,
        payload_json: typeof payload_json === 'string'
          ? payload_json
          : JSON.stringify(payload_json || {}),
        read: false
      }, { transaction });

      return notif;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create new notification', 500)
    }
  }

  async getNotifsByUser(userId, filters) {
    try {
      const { read, type, page = 1, limit = 20 } = filters;
      const where = { user_id: userId }

      if (type) {
        where.type = type;
      }

      if (read !== undefined) {
        where.read = read === true || read === 'true';
      }

      const { count, rows: notifs } = await Notification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      return {
        notifs,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit))
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to gett notifications', 500)
    }
  }

  async getUnreadCount(userId) {
    try {
      return await Notification.count({ where: { user_id: userId, read: false } });
    } catch (error) {
      throw new AppError('Failed to get unread notification count', 500, { cause: error });
    }
  }

  async markAsRead(notifId, userId) {
    try {
      const notif = await Notification.findOne({ where: { id: notifId, user_id: userId } });
      if (!notif) {
        throw new AppError('Notification not found', 404);
      }
      notif.read = true;
      await notif.save();

      return notif;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to mark notification as read', 500, { cause: error });
    }
  }

  async markAllAsRead(userId) {
    try {
      await Notification.update(
        { read: true },
        { where: { user_id: userId, read: false }},
      )
      return { message: 'All notifications marked as read' }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to mark all notifications as read', 500, { cause: error });
    }
  }

  async deleteNotif(notifId, userId) {
    try {
      const notif = await Notification.findOne({ where: { id: notifId, user_id: userId } });
      if (!notif) {
        throw new AppError('Notification not found', 404);
      }
      await notif.destroy();
      return { message: 'Notification deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete notification', 500, { cause: error });
    }
  }
}

module.exports = new NotifService();