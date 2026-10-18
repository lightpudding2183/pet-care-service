const test = require('node:test');
const assert = require('node:assert/strict');

const { Booking, Payment, Provider, ProviderServices, User, sequelize } = require('../src/index');
const paymentService = require('../src/services/payment.service');
const providerService = require('../src/services/provider.service');
const stripeService = require('../src/services/stripe.service');
const AppError = require('../src/utils/error');

async function withMocks(mocks, run) {
  const models = { Booking, Payment, Provider, ProviderServices, User };
  const originals = [];
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };

  for (const [modelName, methods] of Object.entries(mocks)) {
    const model = models[modelName];
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

test('Stripe payment creation retries an existing pending row without a PaymentIntent', async () => {
  const payment = {
    id: 'payment-1',
    booking_id: 'booking-1',
    amount: 25,
    status: 'pending',
    method: 'stripe',
    payment_provider_ref: null
  };
  const originalCreateIntent = stripeService.createPaymentIntent;
  let attemptedIntentFor;
  stripeService.createPaymentIntent = async (candidate) => {
    attemptedIntentFor = candidate;
    return { paymentIntentId: 'pi-retry', clientSecret: 'secret' };
  };

  try {
    await withMocks({
      Booking: { findByPk: async () => ({ id: 'booking-1', status: 'pending', provider_id: 'provider-1' }) },
      Payment: {
        findOne: async () => payment,
        create: async () => assert.fail('retry must reuse existing payment row')
      }
    }, async () => {
      const result = await paymentService.createPayment({ booking_id: 'booking-1', method: 'stripe' });
      assert.equal(result.payment, payment);
      assert.equal(attemptedIntentFor, payment);
      assert.equal(result.paymentIntentId, 'pi-retry');
    });
  } finally {
    stripeService.createPaymentIntent = originalCreateIntent;
  }
});

test('Stripe refund failure leaves payment and booking unchanged', async () => {
  const payment = {
    id: 'payment-1',
    booking_id: 'booking-1',
    method: 'stripe',
    status: 'paid',
    payment_provider_ref: 'pi-1',
    save: async () => assert.fail('failed Stripe refund must not update payment')
  };
  const originalCreateRefund = stripeService.createRefund;
  stripeService.createRefund = async () => {
    throw new AppError('Stripe refund failed', 502);
  };

  try {
    await withMocks({
      Payment: { findByPk: async () => payment },
      Booking: { findByPk: async () => assert.fail('booking must not be changed after refund failure') }
    }, async () => {
      await assert.rejects(
        () => paymentService.processRefund('payment-1'),
        (error) => error instanceof AppError && error.statusCode === 502
      );
      assert.equal(payment.status, 'paid');
    });
  } finally {
    stripeService.createRefund = originalCreateRefund;
  }
});

test('successful Stripe refund marks the payment refunded and cancels its booking', async () => {
  const payment = {
    id: 'payment-1',
    booking_id: 'booking-1',
    method: 'stripe',
    status: 'paid',
    payment_provider_ref: 'pi-1',
    save: async () => {}
  };
  const booking = {
    status: 'confirmed',
    save: async () => {}
  };
  const originalCreateRefund = stripeService.createRefund;
  let refundRequested = false;
  stripeService.createRefund = async () => { refundRequested = true; };

  try {
    await withMocks({
      Payment: { findByPk: async () => payment },
      Booking: { findByPk: async () => booking }
    }, async () => {
      await paymentService.processRefund('payment-1');
      assert.equal(refundRequested, true);
      assert.equal(payment.status, 'refunded');
      assert.equal(booking.status, 'cancelled');
    });
  } finally {
    stripeService.createRefund = originalCreateRefund;
  }
});

test('payment status rejects users who do not own the associated booking', async () => {
  await withMocks({
    Payment: { findByPk: async () => ({ id: 'payment-1', booking_id: 'booking-1' }) },
    Booking: { findByPk: async () => ({ user_id: 'booking-owner' }) }
  }, async () => {
    await assert.rejects(
      () => paymentService.getPaymentStatus('payment-1', 'other-user', 'user'),
      (error) => error instanceof AppError && error.statusCode === 403
    );
  });
});

test('provider creation rejects a user who already has a provider profile', async () => {
  await withMocks({
    User: { findByPk: async () => ({ id: 'user-1', role: 'user' }) },
    Provider: {
      findOne: async () => ({ id: 'provider-existing' }),
      create: async () => assert.fail('duplicate provider must not be created')
    }
  }, async () => {
    await assert.rejects(
      () => providerService.createProvider({}, 'user-1'),
      (error) => error instanceof AppError && error.statusCode === 409
    );
  });
});

test('provider creation promotes the user role on successful registration', async () => {
  const user = {
    id: 'user-1',
    role: 'user',
    save: async () => {}
  };
  const provider = { id: 'provider-1', user_id: 'user-1' };
  await withMocks({
    User: { findByPk: async () => user },
    Provider: {
      findOne: async () => null,
      create: async (data) => ({ ...provider, ...data })
    }
  }, async (transaction) => {
    const result = await providerService.createProvider({ business_name: 'Care' }, 'user-1');
    assert.equal(result.user_id, 'user-1');
    assert.equal(user.role, 'provider');
    assert.equal(transaction.LOCK.UPDATE, 'UPDATE');
  });
});