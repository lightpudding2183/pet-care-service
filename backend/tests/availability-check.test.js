const test = require('node:test');
const assert = require('node:assert/strict');
const { Op } = require('sequelize');

const { Booking, Provider, Pet, Availability, Notification, ProviderServices, sequelize } = require('../src/index');
const bookingService = require('../src/services/booking.service');
const bookingController = require('../src/controllers/booking.controller');
const bookingRoutes = require('../src/routes/booking.routes');
const AppError = require('../src/utils/error');
const modelRegistry = { Booking, Provider, Pet, Availability, Notification, ProviderServices };

const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
const baseBooking = {
  provider_id: 'provider-123',
  user_id: 'user-123',
  pet_id: 'pet-123',
  service_id: 'service-123',
  start_time: startTime,
  end_time: new Date(startTime.getTime() + 60 * 60 * 1000)
};

async function withBookingMocks(mocks, run) {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const originals = [];

  for (const [modelName, methods] of Object.entries(mocks)) {
    const model = modelRegistry[modelName];
    for (const [method, replacement] of Object.entries(methods)) {
      originals.push([model, method, model[method]]);
      model[method] = replacement;
    }
  }

  const originalTransaction = sequelize.transaction;
  const originalTableColumns = bookingService._tableColumns;
  sequelize.transaction = async (callback) => callback(transaction);
  bookingService._tableColumns = async (tableName) => tableName === 'provider_services'
    ? { price_unit: true }
    : { service_id: true, price_snapshot: true };
  try {
    await run(transaction);
  } finally {
    sequelize.transaction = originalTransaction;
    bookingService._tableColumns = originalTableColumns;
    for (const [model, method, original] of originals.reverse()) {
      model[method] = original;
    }
  }
}

const validCreationMocks = {
  Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner', verified: true }) },
  ProviderServices: { findOne: async () => ({ price: '45.00' }) },
  Pet: { findOne: async () => ({ id: 'pet-123', owner_id: 'user-123' }) },
  Availability: { findOne: async () => ({ id: 'availability-1' }) },
  Booking: { findOne: async () => null }
};

test('booking rejects an overlapping active provider booking', async () => {
  let created = false;
  await withBookingMocks({
    ...validCreationMocks,
    Booking: {
      findOne: async () => ({ id: 'existing-booking' }),
      create: async () => { created = true; }
    }
  }, async () => {
    await assert.rejects(
      () => bookingService.createBooking({ ...baseBooking }),
      (error) => error instanceof AppError && error.statusCode === 409
    );
    assert.equal(created, false);
  });
});

test('booking is created when no provider booking overlaps', async () => {
  const expectedBooking = { id: 'new-booking' };
  let providerLock;
  let createdData;
  let notificationData;
  await withBookingMocks({
    ...validCreationMocks,
    Provider: {
      findByPk: async (_id, options) => {
        providerLock = options.lock;
        return { id: 'provider-123', user_id: 'provider-owner', verified: true };
      }
    },
    Booking: {
      findOne: async () => null,
      create: async (data) => {
        createdData = data;
        return expectedBooking;
      }
    },
    Notification: {
      create: async (data) => {
        notificationData = data;
        return data;
      }
    }
  }, async (transaction) => {
    const booking = await bookingService.createBooking({ ...baseBooking, status: 'cancelled' });
    assert.equal(booking, expectedBooking);
    assert.equal(providerLock, transaction.LOCK.UPDATE);
    assert.equal(createdData.status, undefined);
    assert.equal(createdData.service_id, 'service-123');
    assert.equal(createdData.price_snapshot, 45);
    assert.equal(notificationData.user_id, 'provider-owner');
    assert.equal(notificationData.type, 'booking.created');
    assert.equal(JSON.parse(notificationData.payload_json).booking_id, 'new-booking');
  });
});

test('booking rejects missing required fields', async () => {
  await assert.rejects(
    () => bookingService.createBooking({
      provider_id: 'provider-123',
      pet_id: 'pet-123',
      user_id: 'user-123',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
      end_time: new Date(Date.now() + 25 * 60 * 60 * 1000)
    }),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test('booking rejects a pet that does not belong to the requesting user', async () => {
  await withBookingMocks({
    ...validCreationMocks,
    Pet: { findOne: async () => null }
  }, async () => {
    await assert.rejects(
      () => bookingService.createBooking({ ...baseBooking }),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});

test('booking rejects a requested time outside provider availability', async () => {
  await withBookingMocks({
    ...validCreationMocks,
      Availability: { findOne: async () => null, findAll: async () => [] }
  }, async () => {
    await assert.rejects(
      () => bookingService.createBooking({ ...baseBooking }),
      (error) => error instanceof AppError && error.statusCode === 409
    );
  });
});

test('booking accepts a future time inside a recurring weekly availability window', async () => {
  const requestedStart = new Date();
  requestedStart.setUTCDate(requestedStart.getUTCDate() + 3);
  requestedStart.setUTCHours(10, 0, 0, 0);
  const requestedEnd = new Date(requestedStart.getTime() + 60 * 60 * 1000);
  const templateDate = new Date(Date.UTC(2026, 0, 1));
  templateDate.setUTCDate(templateDate.getUTCDate() + ((requestedStart.getUTCDay() - templateDate.getUTCDay() + 7) % 7));
  const templateStart = new Date(templateDate);
  templateStart.setUTCHours(9, 0, 0, 0);
  const templateEnd = new Date(templateDate);
  templateEnd.setUTCHours(17, 0, 0, 0);

  await withBookingMocks({
    Availability: {
      findOne: async () => null,
      findAll: async () => [{ date: templateDate, start_time: templateStart, end_time: templateEnd }]
    }
  }, async () => {
    await bookingService._assertAvailable('provider-123', requestedStart, requestedEnd);
  });
});

test('booking rejects starts in the past', async () => {
  await assert.rejects(
    () => bookingService.createBooking({ ...baseBooking, start_time: new Date(Date.now() - 1000) }),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test('booking rejects an unverified provider', async () => {
  await withBookingMocks({
    ...validCreationMocks,
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner', verified: false }) },
    ProviderServices: { findOne: async () => assert.fail('service should not be queried for unverified provider') }
  }, async () => {
    await assert.rejects(
      () => bookingService.createBooking({ ...baseBooking }),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});

test('booking details reject users who own neither the booking nor provider', async () => {
  await withBookingMocks({
    Booking: {
      findByPk: async () => ({
        user_id: 'booking-owner',
        provider: { user_id: 'provider-owner' }
      })
    }
  }, async () => {
    await assert.rejects(
      () => bookingService.getBookingDetails('booking-123', 'other-user', 'user'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});

test('booking updates reject users who do not own the booking or provider', async () => {
  await withBookingMocks({
    Booking: {
      findByPk: async () => ({
        user_id: 'booking-owner',
        provider_id: 'provider-123',
        start_time: baseBooking.start_time,
        end_time: baseBooking.end_time,
        update: async () => assert.fail('unauthorized update must not persist')
      })
    },
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) }
  }, async () => {
    await assert.rejects(
      () => bookingService.updateBooking('booking-123', { status: 'cancelled' }, 'other-user', 'user'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});

test('provider can confirm a pending booking but customer cannot', async () => {
  const booking = {
    user_id: 'customer-1',
    provider_id: 'provider-123',
    status: 'pending',
    start_time: baseBooking.start_time,
    end_time: baseBooking.end_time,
    update: async function (changes) { Object.assign(this, changes); return this; }
  };

  await withBookingMocks({
    Booking: { findByPk: async () => booking },
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) }
  }, async () => {
    await assert.rejects(
      () => bookingService.updateBooking('booking-1', { status: 'confirmed' }, 'customer-1', 'user'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
    const updated = await bookingService.updateBooking('booking-1', { status: 'confirmed' }, 'provider-owner', 'provider');
    assert.equal(updated.status, 'confirmed');
  });
});

test('provider follows confirmed -> in_progress -> completed transitions', async () => {
  const booking = {
    user_id: 'customer-1',
    provider_id: 'provider-123',
    status: 'confirmed',
    start_time: baseBooking.start_time,
    end_time: baseBooking.end_time,
    update: async function (changes) { Object.assign(this, changes); return this; }
  };
  await withBookingMocks({
    Booking: { findByPk: async () => booking },
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) }
  }, async () => {
    await bookingService.updateBooking('booking-1', { status: 'in_progress' }, 'provider-owner', 'provider');
    assert.equal(booking.status, 'in_progress');
    await bookingService.updateBooking('booking-1', { status: 'completed' }, 'provider-owner', 'provider');
    assert.equal(booking.status, 'completed');
    await assert.rejects(
      () => bookingService.updateBooking('booking-1', { status: 'cancelled' }, 'customer-1', 'user'),
      (error) => error instanceof AppError && error.statusCode === 409
    );
  });
});

test('owner cancellation soft-updates status without destroying the booking', async () => {
  let destroyed = false;
  const booking = {
    user_id: 'customer-1',
    provider_id: 'provider-123',
    status: 'confirmed',
    start_time: baseBooking.start_time,
    end_time: baseBooking.end_time,
    destroy: async () => { destroyed = true; },
    update: async function (changes) { Object.assign(this, changes); return this; }
  };
  await withBookingMocks({
    Booking: { findByPk: async () => booking },
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) }
  }, async () => {
    await bookingService.deleteBooking('booking-1', 'customer-1', 'user');
  });
  assert.equal(booking.status, 'cancelled');
  assert.equal(destroyed, false);
});

test('booking lists filter and paginate results', async () => {
  let query;
  await withBookingMocks({
    Booking: {
      findAndCountAll: async (options) => {
        query = options;
        return { count: 21, rows: [{ id: 'booking-1' }] };
      }
    }
  }, async () => {
    const result = await bookingService.getBookingsByUserId('customer-1', {
      status: 'confirmed',
      from: '2026-10-25T00:00:00.000Z',
      to: '2026-10-26T00:00:00.000Z',
      page: '2',
      limit: '10'
    });
    assert.deepEqual(result, { bookings: [{ id: 'booking-1' }], total: 21, page: 2, totalPages: 3 });
  });

  assert.equal(query.where.user_id, 'customer-1');
  assert.equal(query.where.status, 'confirmed');
  assert.equal(query.limit, 10);
  assert.equal(query.offset, 10);
  assert.deepEqual(query.attributes, [
    'id', 'user_id', 'provider_id', 'pet_id', 'status', 'start_time', 'end_time', 'created_at', 'updated_at'
  ]);
  assert.ok(!query.include.some((include) => include.as === 'service'));
  const providerJoin = query.include.find((include) => include.as === 'provider');
  const providerServicesJoin = providerJoin.include.find((include) => include.as === 'provider_services');
  assert.deepEqual(providerServicesJoin.attributes, ['id', 'provider_id', 'service_id', 'price']);
});

test('provider busy-slot lookup returns only non-cancelled overlapping intervals', async () => {
  let query;
  const expected = [{ start_time: new Date('2026-11-02T10:00:00Z'), end_time: new Date('2026-11-02T11:00:00Z') }];
  const originalFindAll = Booking.findAll;
  Booking.findAll = async (options) => {
    query = options;
    return expected;
  };

  try {
    const result = await bookingService.getProviderBusySlots(
      'provider-1',
      '2026-11-02T09:00:00Z',
      '2026-11-02T12:00:00Z'
    );
    assert.deepEqual(result, expected);
    assert.deepEqual(query.attributes, ['start_time', 'end_time']);
    assert.equal(query.where.provider_id, 'provider-1');
    assert.equal(query.where.status[Op.ne], 'cancelled');
    assert.ok(query.where.start_time[Op.lt]);
    assert.ok(query.where.end_time[Op.gt]);
  } finally {
    Booking.findAll = originalFindAll;
  }
});

test('provider busy-slot lookup rejects invalid time ranges', async () => {
  await assert.rejects(
    () => bookingService.getProviderBusySlots('provider-1', 'invalid', '2026-11-02T12:00:00Z'),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test('booking price quote calculates totals from the provider rate unit', async () => {
  const originalProviderFindByPk = Provider.findByPk;
  const originalProviderServiceFindOne = ProviderServices.findOne;
  const originalTableColumns = bookingService._tableColumns;
  Provider.findByPk = async () => ({ id: 'provider-1', verified: true });
  ProviderServices.findOne = async () => ({ price: '12.50', price_unit: 'hour' });
  bookingService._tableColumns = async () => ({ price_unit: true });

  try {
    const quote = await bookingService.quoteBookingPrice(
      'provider-1',
      'service-1',
      '2026-11-02T09:00:00Z',
      '2026-11-02T11:30:00Z'
    );
    assert.deepEqual(quote, { amount: 31.25, rate: 12.5, unit: 'hour', units: 2.5 });
  } finally {
    Provider.findByPk = originalProviderFindByPk;
    ProviderServices.findOne = originalProviderServiceFindOne;
    bookingService._tableColumns = originalTableColumns;
  }
});

test('my bookings route is GET / and requires mine=1', async () => {
  const routes = bookingRoutes.stack.filter((layer) => layer.route);
  assert.ok(routes.some((layer) => layer.route.path === '/' && layer.route.methods.get));
  assert.ok(!routes.some((layer) => layer.route.path === '/users/:userId/bookings'));

  const AppError = require('../src/utils/error');
  const original = bookingService.getBookingsByUserId;
  let forwarded;
  bookingService.getBookingsByUserId = async () => [];
  try {
    await bookingController.getBookingsByUserId({ query: {}, user: { id: 'customer-1' } }, {}, (error) => {
      forwarded = error;
    });
    await new Promise((resolve) => setImmediate(resolve));
  } finally {
    bookingService.getBookingsByUserId = original;
  }
  assert.ok(forwarded instanceof AppError);
  assert.equal(forwarded.statusCode, 400);
});

test('booking deletion rejects users who are not the booking owner', async () => {
  await withBookingMocks({
    Booking: {
      findByPk: async () => ({
        user_id: 'booking-owner',
        provider_id: 'provider-123',
        status: 'confirmed',
        start_time: baseBooking.start_time,
        end_time: baseBooking.end_time,
        update: async () => assert.fail('unauthorized cancellation must not persist')
      })
    },
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) }
  }, async () => {
    await assert.rejects(
      () => bookingService.deleteBooking('booking-123', 'other-user', 'user'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});

test('provider booking lists reject users who do not own the provider', async () => {
  await withBookingMocks({
    Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) },
    Booking: { findAndCountAll: async () => assert.fail('unauthorized list must not be queried') }
  }, async () => {
    await assert.rejects(
      () => bookingService.getBookingsByProviderId('provider-123', 'other-user', 'provider'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});
