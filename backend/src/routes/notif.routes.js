const express = require('express');
const router = express.Router();

const {
  createNotif, 
  getNotifsByUser, 
  markAsRead, 
  markAllAsRead, 
  deleteNotif,
  getUnreadCount
} = require('../controllers/notif.controller');
const requireAuth = require('../middlewares/auth.middleware');

router.post('/', requireAuth, createNotif);
router.get('/', requireAuth, getNotifsByUser);
router.patch('/:notifId/read', requireAuth, markAsRead);
router.put('/read-all', requireAuth, markAllAsRead);
router.delete('/:notifId', requireAuth, deleteNotif);
router.get('/unread/count', requireAuth, getUnreadCount);

module.exports = router;