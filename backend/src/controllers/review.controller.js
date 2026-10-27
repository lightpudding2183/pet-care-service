const reviewService = require('../services/review.service');
const asyncHandler = require('../utils/asyncHandler');

const createReview = asyncHandler(async (req, res) => {
  const { booking_id, rating, comment } = req.body;
  const result = await reviewService.createReview({ booking_id, rating, comment, user_id: req.user.id });
  res.status(201).json(result);
});

const getReviewByProvider = asyncHandler(async (req, res) => {
  const { rating } = req.query;
  const result = await reviewService.getReviewByProvider(req.params.providerId, rating ? { rating } : {});
  res.status(200).json(result);
});

const getAverageRating = asyncHandler(async (req, res) => {
  const averageRating = await reviewService.getAverageRating(req.params.providerId);
  res.status(200).json(averageRating);
});

const getReviewsByUser = asyncHandler(async (req, res) => {
  const result = await reviewService.getReviewsByUser(req.user.id, req.params.bookingId);
  res.status(200).json(result);
});

module.exports = { createReview, getReviewByProvider, getAverageRating, getReviewsByUser }