const bookingService = require('../services/booking.service');
const AppError = require('../utils/error');

async function createBooking(req, res) {
  try {
    const bookingData = {
      ...req.body,
      user_id: req.user.id
    };
    const newBooking = await bookingService.createBooking(bookingData);
    res.status(201).json(newBooking);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getBookingDetails(req, res) {
  try {
    const bookingId = req.params.id;
    const bookingDetails = await bookingService.getBookingDetails(bookingId, req.user.id, req.user.role);
    res.status(200).json(bookingDetails);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getBookingsByUserId(req, res) {
  try {
    const userId = req.user.id;
    const bookings = await bookingService.getBookingsByUserId(userId);
    res.status(200).json(bookings);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updateBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const updateData = { ...req.body };
    delete updateData.user_id;
    delete updateData.id;
    const updatedBooking = await bookingService.updateBooking(bookingId, updateData, req.user.id, req.user.role);
    res.status(200).json(updatedBooking);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function deleteBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const deletedBooking = await bookingService.deleteBooking(bookingId, req.user.id, req.user.role);
    res.status(200).json(deletedBooking);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getBookingsByProviderId(req, res) {
  try {
    const providerId = req.params.providerId;
    const bookings = await bookingService.getBookingsByProviderId(providerId, req.user.id, req.user.role);
    res.status(200).json(bookings);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = {
  createBooking,
  getBookingDetails,
  getBookingsByUserId,
  updateBooking,
  deleteBooking,
  getBookingsByProviderId
};
