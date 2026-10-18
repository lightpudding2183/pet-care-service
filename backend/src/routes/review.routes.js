const express = require('express');
const router = express.Router();

const requireAuth = require('../middlewares/auth.middleware');
const {
  createReview,
  getReviewByProvider,
  getAverageRating,
  getReviewsByUser
} = require('../controllers/review.controller');

router.post('/', requireAuth, createReview);
router.get('/provider/:providerId', getReviewByProvider);
router.get('/provider/:providerId/average', getAverageRating);
router.get('/booking/:bookingId', requireAuth, getReviewsByUser);

module.exports = router;