const test = require('node:test');
const assert = require('node:assert/strict');

const { Booking, Provider, Review, sequelize } = require('../src/index');
const reviewController = require('../src/controllers/review.controller');
const reviewService = require('../src/services/review.service');

async function withMocks(mocks, run) {
  const models = { Booking, Provider, Review };
  const originals = [];
  for (const [modelName, methods] of Object.entries(mocks)) {
    const model = models[modelName];
    for (const [method, replacement] of Object.entries(methods)) {
      originals.push([model, method, model[method]]);
      model[method] = replacement;
    }
  }

  const originalTransaction = sequelize.transaction;
  sequelize.transaction = async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } });
  try {
    await run();
  } finally {
    sequelize.transaction = originalTransaction;
    for (const [model, method, original] of originals.reverse()) {
      model[method] = original;
    }
  }
}

test('review creation uses reviewer/reviewee fields and updates provider rating aggregates', async () => {
  const review = { id: 'review-1' };
  let createdReviewData;
  let aggregateQuery;
  let providerUpdate;
  const provider = {
    update: async (data) => { providerUpdate = data; }
  };

  await withMocks({
    Booking: {
      findByPk: async () => ({
        id: 'booking-1',
        user_id: 'user-1',
        provider_id: 'provider-1',
        status: 'confirmed'
      })
    },
    Provider: { findByPk: async () => provider },
    Review: {
      create: async (data) => {
        createdReviewData = data;
        return review;
      },
      findAll: async (query) => {
        aggregateQuery = query;
        return [{ average: '4.5', count: '2' }];
      }
    }
  }, async () => {
    const result = await reviewService.createReview({
      booking_id: 'booking-1',
      rating: 5,
      comment: 'Great care',
      user_id: 'user-1'
    });

    assert.equal(result, review);
  });

  assert.deepEqual(createdReviewData, {
    booking_id: 'booking-1',
    rating: 5,
    comment: 'Great care',
    reviewer_id: 'user-1',
    reviewee_id: 'provider-1'
  });
  assert.equal(aggregateQuery.where.reviewee_id, 'provider-1');
  assert.deepEqual(providerUpdate, { rating_avg: 4.5, rating_count: 2 });
});

test('provider review listing filters by reviewee_id', async () => {
  let query;
  await withMocks({
    Review: { findAll: async (options) => { query = options; return []; } }
  }, async () => {
    await reviewService.getReviewByProvider('provider-1', { rating: '4' });
  });

  assert.deepEqual(query.where, { reviewee_id: 'provider-1', rating: '4' });
});

test('provider review controller reads the rating filter from the query string', async () => {
  const originalGetReviewByProvider = reviewService.getReviewByProvider;
  let receivedFilter;
  reviewService.getReviewByProvider = async (_providerId, filter) => {
    receivedFilter = filter;
    return [];
  };

  const response = {
    statusCode: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) { this.body = body; }
  };

  try {
    await reviewController.getReviewByProvider({
      params: { providerId: 'provider-1' },
      query: { rating: '4' }
    }, response);
  } finally {
    reviewService.getReviewByProvider = originalGetReviewByProvider;
  }

  assert.deepEqual(receivedFilter, { rating: '4' });
  assert.equal(response.statusCode, 200);
});

test('review model marks booking_id unique', () => {
  assert.equal(Review.rawAttributes.booking_id.unique, 'review_booking_id_unique');
});
