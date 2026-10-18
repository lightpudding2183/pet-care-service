const Review = require('../models/review.model');
const reviewService = require('../services/review.service');
const AppError = require('../utils/error');

async function createReview(req, res) {
  try {
    const { booking_id, rating, comment } = req.body;
    const userId = req.user.id;

    const result = await reviewService.createReview({
      booking_id,
      rating,
      comment,
      user_id: userId
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getReviewByProvider(req, res) {
  try {
    const providerId = req.params.providerId;
    const rating = req.body;
    const filter = {}

    if(rating) filter.rating = rating;
    const result = await reviewService.getReviewByProvider(providerId, filter);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getAverageRating(req, res) {
  try {
    const providerId = req.params.providerId;
    const averageRating = await reviewService.getAverageRating(providerId);
    res.status(200).json(averageRating);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getReviewsByUser(req, res) {
  try {
    const userId = req.user.id;
    const bookingId = req.params.bookingId;
    const result = await reviewService.getReviewsByUser(userId, bookingId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = { createReview, getReviewByProvider, getAverageRating, getReviewsByUser }