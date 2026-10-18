const { getStripe } = require('../config/stripe');
const { Payment } = require('../index');
const AppError = require('../utils/error');
const paymentService = require('./payment.service');

const CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

class StripeService {
  toStripeAmount(amount) {
    return Math.round(Number(amount) * 100);
  }

  async createPaymentIntent(payment) {
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: this.toStripeAmount(payment.amount),
      currency: CURRENCY,
      metadata: {
        payment_id: payment.id,
        booking_id: payment.booking_id
      },
      automatic_payment_methods: {
        enabled: true
      }
    }, { idempotencyKey: `payment-intent-${payment.id}` });

    payment.payment_provider_ref = paymentIntent.id;
    await payment.save();

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret
    };
  }

  async createRefund(payment) {
    if (!payment.payment_provider_ref) {
      throw new AppError('Stripe PaymentIntent reference is missing', 400);
    }

    try {
      const stripe = getStripe();
      return await stripe.refunds.create(
        { payment_intent: payment.payment_provider_ref },
        { idempotencyKey: `payment-refund-${payment.id}` }
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refund payment through Stripe', 502, { cause: error });
    }
  }

  constructEvent(rawBody, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new AppError('STRIPE_WEBHOOK_SECRET is not configured', 500);
    }
    if (!signature) {
      throw new AppError('Missing Stripe signature', 400);
    }

    try {
      const stripe = getStripe();
      return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Webhook signature verification failed: ${error.message}`, 400);
    }
  }

  async findPaymentFromStripeObject(stripeObject) {
    const paymentId = stripeObject.metadata?.payment_id;
    const providerRef = stripeObject.id;

    if (paymentId) {
      const byId = await Payment.findByPk(paymentId);
      if (byId) return byId;
    }

    if (providerRef) {
      const byRef = await Payment.findOne({
        where: { payment_provider_ref: providerRef }
      });
      if (byRef) return byRef;
    }

    return null;
  }

  async handleWebhookEvent(event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.onPaymentIntentSucceeded(event.data.object);
      case 'payment_intent.payment_failed':
        return this.onPaymentIntentFailed(event.data.object);
      case 'charge.refunded':
        return this.onChargeRefunded(event.data.object);
      default:
        return { handled: false, type: event.type };
    }
  }

  async onPaymentIntentSucceeded(paymentIntent) {
    const payment = await this.findPaymentFromStripeObject(paymentIntent);
    if (!payment) {
      throw new AppError('Payment not found for Stripe PaymentIntent', 404);
    }

    if (payment.status === 'paid') {
      return { handled: true, payment, alreadyProcessed: true };
    }

    const updated = await paymentService.updatePaymentStatus(payment.id, {
      status: 'paid',
      payment_provider_ref: paymentIntent.id
    });

    return { handled: true, payment: updated };
  }

  async onPaymentIntentFailed(paymentIntent) {
    const payment = await this.findPaymentFromStripeObject(paymentIntent);
    if (!payment) {
      return { handled: true, skipped: true };
    }

    // Keep pending so the client can retry; store the latest intent id.
    if (payment.payment_provider_ref !== paymentIntent.id) {
      payment.payment_provider_ref = paymentIntent.id;
      await payment.save();
    }

    return { handled: true, payment, status: payment.status };
  }

  async onChargeRefunded(charge) {
    const paymentIntentId = charge.payment_intent;
    if (!paymentIntentId) {
      return { handled: false, reason: 'missing payment_intent' };
    }

    const payment = await Payment.findOne({
      where: { payment_provider_ref: paymentIntentId }
    });

    if (!payment) {
      throw new AppError('Payment not found for Stripe refund', 404);
    }

    if (payment.status === 'refunded') {
      return { handled: true, payment, alreadyProcessed: true };
    }

    if (payment.status !== 'paid') {
      return { handled: true, payment, skipped: true };
    }

    const updated = await paymentService.processRefund(payment.id, { stripeAlreadyRefunded: true });
    return { handled: true, payment: updated };
  }
}

module.exports = new StripeService();
