const express = require('express');
const router = express.Router();

const {
  createBooking,
  quoteBookingPrice,
  getBookingDetails,
  getBookingsByUserId,
  updateBooking,
  deleteBooking,
  getBookingsByProviderId,
  getProviderBusySlots
} = require('../controllers/booking.controller');
const requireAuth = require('../middlewares/auth.middleware');

router.post('/quote', requireAuth, quoteBookingPrice);
router.post('/', requireAuth, createBooking);
router.get('/', requireAuth, getBookingsByUserId);
router.get('/providers/:providerId/busy-slots', requireAuth, getProviderBusySlots);
router.get('/providers/:providerId/bookings', requireAuth, getBookingsByProviderId);
router.get('/:id', requireAuth, getBookingDetails);
router.put('/:id', requireAuth, updateBooking);
router.delete('/:id', requireAuth, deleteBooking);

module.exports = router;
