const express = require('express');
const router = express.Router();

const {
  createBooking,
  getBookingDetails,
  getBookingsByUserId,
  updateBooking,
  deleteBooking,
  getBookingsByProviderId
} = require('../controllers/booking.controller');
const requireAuth = require('../middlewares/auth.middleware');

router.post('/', requireAuth, createBooking);
router.get('/users/:userId/bookings', requireAuth, getBookingsByUserId);
router.get('/providers/:providerId/bookings', requireAuth, getBookingsByProviderId);
router.get('/:id', requireAuth, getBookingDetails);
router.put('/:id', requireAuth, updateBooking);
router.delete('/:id', requireAuth, deleteBooking);

module.exports = router;
