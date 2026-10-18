const test = require('node:test');
const assert = require('node:assert/strict');

const { Booking, Provider, Pet, Availability, sequelize } = require('../src/index');
const bookingService = require('../src/services/booking.service');
const AppError = require('../src/utils/error');
const modelRegistry = { Booking, Provider, Pet, Availability };

const baseBooking = {
  provider_id: 'provider-123',
  user_id: 'user-123',
  pet_id: 'pet-123',
  start_time: new Date('2026-09-18T10:30:00Z'),
  end_time: new Date('2026-09-18T11:30:00Z')
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
  sequelize.transaction = async (callback) => callback(transaction);
  try {
    await run(transaction);
  } finally {
    sequelize.transaction = originalTransaction;
    for (const [model, method, original] of originals.reverse()) {
      model[method] = original;
    }
  }
}

const validCreationMocks = {
  Provider: { findByPk: async () => ({ id: 'provider-123', user_id: 'provider-owner' }) },
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
  await withBookingMocks({
    ...validCreationMocks,
    Provider: {
      findByPk: async (_id, options) => {
        providerLock = options.lock;
        return { id: 'provider-123', user_id: 'provider-owner' };
      }
    },
    Booking: {
      findOne: async () => null,
      create: async (data) => {
        createdData = data;
        return expectedBooking;
      }
    }
  }, async (transaction) => {
    const booking = await bookingService.createBooking({ ...baseBooking, status: 'cancelled' });
    assert.equal(booking, expectedBooking);
    assert.equal(providerLock, transaction.LOCK.UPDATE);
    assert.equal(createdData.status, undefined);
  });
});

test('booking rejects missing required fields', async () => {
  await assert.rejects(
    () => bookingService.createBooking({
      provider_id: 'provider-123',
      start_time: new Date('2026-09-18T10:30:00Z'),
      end_time: new Date('2026-09-18T11:30:00Z')
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
    Availability: { findOne: async () => null }
  }, async () => {
    await assert.rejects(
      () => bookingService.createBooking({ ...baseBooking }),
      (error) => error instanceof AppError && error.statusCode === 409
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

test('booking deletion rejects users who are not the booking owner', async () => {
  await withBookingMocks({
    Booking: {
      findByPk: async () => ({
        user_id: 'booking-owner',
        destroy: async () => assert.fail('unauthorized delete must not persist')
      })
    }
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
    Booking: { findAll: async () => assert.fail('unauthorized list must not be queried') }
  }, async () => {
    await assert.rejects(
      () => bookingService.getBookingsByProviderId('provider-123', 'other-user', 'provider'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});
