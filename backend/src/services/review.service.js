const { Review, Booking, User, sequelize } = require('../index');
const AppError = require('../utils/error');

class ReviewService {
  async createReview(reviewData) {
    try {
      const { booking_id, rating, comment, user_id } = reviewData;
      if (!booking_id || !rating || !user_id) {
        throw new AppError('Missing required fields: booking_id, rating, user_id', 400);
      }

      if (rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      const booking = await Booking.findByPk(booking_id, {
        include: [{ model: User, as: 'user'}]
      });

      if (!booking) {
        throw new AppError('Booking not found', 400)
      }

      if (booking.user_id !== user_id) {
        throw new AppError('Not authorized to review', 403);
      }

      if (booking.status !== 'confirmed') {
        throw new AppError('Can only review confirmed bookings', 400);
      }

      const review = await Review.create({
        booking_id,
        rating,
        comment: comment || null,
        user_id
      });
      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create review', 500)
    }
  }

  async getReviewByProvider(providerId, filters = {}) {
    try {
      const { rating } = filters;
      const where = { provider_id: providerId }

      if (rating) {
        where.rating = rating;
      }

      const reviews = await Review.findAll({
        where,
        include: [
          { model: User, as: 'user' },
        ],
        order: [['created_at', 'DESC']]
      })
      return reviews;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get reviews', 500)
    }
  }

  async getAverageRating(providerId) {
    try {
      const result = await Review.findAll({
        where: { provider_id: providerId },
        attributes: [[sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']]     
      })

      const average = result[0].getDataValue('averageRating') || 0;
      const totalReview = await Review.count({ where: { provider_id: providerId } })

      return { average, totalReview }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get average rating', 500)
    }
  }

  async getReviewsByUser(userId, bookingId) {
    try {
      const review = await Review.findAll({
        where: { 
          user_id: userId,
          booking_id: bookingId
         },
      })
      return review;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get reviews', 500)
    }
  }
}

module.exports = new ReviewService();