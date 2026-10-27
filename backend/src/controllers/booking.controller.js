const bookingService = require('../services/booking.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/error');

const createBooking = asyncHandler(async (req, res) => {
  const bookingData = { ...req.body, user_id: req.user.id };
  const newBooking = await bookingService.createBooking(bookingData);
  res.status(201).json(newBooking);
});

const getBookingDetails = asyncHandler(async (req, res) => {
  const bookingDetails = await bookingService.getBookingDetails(req.params.id, req.user.id, req.user.role);
  res.status(200).json(bookingDetails);
});

const getBookingsByUserId = asyncHandler(async (req, res) => {
  if (req.query.mine !== '1') {
    throw new AppError('Use mine=1 to list your bookings', 400);
  }
  const result = await bookingService.getBookingsByUserId(req.user.id, req.query);
  res.status(200).json(result);
});

const updateBooking = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  delete updateData.user_id;
  delete updateData.id;
  const updatedBooking = await bookingService.updateBooking(req.params.id, updateData, req.user.id, req.user.role);
  res.status(200).json(updatedBooking);
});

const deleteBooking = asyncHandler(async (req, res) => {
  const deletedBooking = await bookingService.deleteBooking(req.params.id, req.user.id, req.user.role);
  res.status(200).json(deletedBooking);
});

const getBookingsByProviderId = asyncHandler(async (req, res) => {
  const result = await bookingService.getBookingsByProviderId(
    req.params.providerId,
    req.user.id,
    req.user.role,
    req.query
  );
  res.status(200).json(result);
});

module.exports = {
  createBooking,
  getBookingDetails,
  getBookingsByUserId,
  updateBooking,
  deleteBooking,
  getBookingsByProviderId
};
