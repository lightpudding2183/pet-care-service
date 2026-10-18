const { Op } = require('sequelize');
const { Payment, Booking, Pet, ProviderServices, sequelize } = require('../index');
const AppError = require('../utils/error');

class PaymentService {
  async resolveAmount(booking, serviceId) {
    const where = { provider_id: booking.provider_id };
    if (serviceId) {
      where.service_id = serviceId;
    }

    const services = await ProviderServices.findAll({ where });
    if (!services.length) {
      throw new AppError('No matching priced service for this provider', 400);
    }
    if (!serviceId && services.length > 1) {
      throw new AppError('service_id is required when provider offers multiple services', 400);
    }
    return services[0].price;
  }

  async createPayment(paymentData) {
    try {
      const { booking_id, method, service_id, amount: providedAmount } = paymentData;
      if (!booking_id || !method) {
        throw new AppError('Missing required payment fields', 400);
      }

      const allowedMethods = ['cash', 'stripe'];
      if (!allowedMethods.includes(method)) {
        throw new AppError('Invalid payment method', 400);
      }

      const booking = await Booking.findByPk(booking_id);
      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      if (booking.status === 'cancelled') {
        throw new AppError('Cannot create payment for a cancelled booking', 400);
      }

      const existingPayment = await Payment.findOne({ where: { booking_id } });
      const canRetryStripeCreation = existingPayment
        && existingPayment.status === 'pending'
        && existingPayment.method === 'stripe'
        && !existingPayment.payment_provider_ref
        && method === 'stripe';
      if (existingPayment && !canRetryStripeCreation) {
        throw new AppError('Payment already exists', 409);
      }

      const amount = canRetryStripeCreation
        ? existingPayment.amount
        : providedAmount ?? await this.resolveAmount(booking, service_id);
      if (!amount || amount <= 0) {
        throw new AppError('Invalid payment amount', 400);
      }

      const payment = canRetryStripeCreation ? existingPayment : await Payment.create({
        booking_id,
        amount,
        status: 'pending',
        method,
        payment_provider_ref: null
      });

      if (method === 'stripe') {
        const stripeService = require('./stripe.service');
        const stripeSession = await stripeService.createPaymentIntent(payment);
        return {
          payment,
          clientSecret: stripeSession.clientSecret,
          paymentIntentId: stripeSession.paymentIntentId
        };
      }

      return { payment };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create payment', 500, { cause: error });
    }
  }

  async updatePaymentStatus(paymentId, { status, payment_provider_ref } = {}) {
    try {
      const validStatuses = ['pending', 'paid', 'refunded'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Invalid payment status', 400);
      }

      const payment = await this.getPaymentById(paymentId);
      payment.status = status;
      if (payment_provider_ref !== undefined) {
        payment.payment_provider_ref = payment_provider_ref;
      }
      await payment.save();

      if (status === 'paid') {
        const booking = await Booking.findByPk(payment.booking_id);
        if (booking && booking.status === 'pending') {
          booking.status = 'confirmed';
          await booking.save();
        }
      }

      return payment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update payment status', 500, { cause: error });
    }
  }

  async processRefund(paymentId, { stripeAlreadyRefunded = false } = {}) {
    try {
      const currentPayment = await Payment.findByPk(paymentId);
      if (!currentPayment) {
        throw new AppError('Payment not found', 404);
      }
      if (currentPayment.status !== 'paid') {
        throw new AppError('Can only refund paid payments', 400);
      }

      if (currentPayment.method === 'stripe' && !stripeAlreadyRefunded) {
        const stripeService = require('./stripe.service');
        await stripeService.createRefund(currentPayment);
      }

      return await sequelize.transaction(async (transaction) => {
        const payment = await Payment.findByPk(paymentId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });
        if (!payment) {
          throw new AppError('Payment not found', 404);
        }
        if (payment.status === 'refunded') {
          return payment;
        }
        if (payment.status !== 'paid') {
          throw new AppError('Can only refund paid payments', 400);
        }

        payment.status = 'refunded';
        await payment.save({ transaction });

        const booking = await Booking.findByPk(payment.booking_id, { transaction });
        if (booking && booking.status !== 'cancelled') {
          booking.status = 'cancelled';
          await booking.save({ transaction });
        }

        return payment;
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to process refund', 500, { cause: error });
    }
  }

  async getPaymentByBooking(bookingId) {
    try {
      const payment = await Payment.findOne({ where: { booking_id: bookingId } });
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }
      return payment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get payment', 500, { cause: error });
    }
  }

  async getPaymentById(paymentId) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }
      return payment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get payment', 500, { cause: error });
    }
  }

  async getPaymentStatus(paymentId, userId, role) {
    const payment = await this.getPaymentById(paymentId);
    if (role !== 'admin') {
      const booking = await Booking.findByPk(payment.booking_id);
      if (!booking || booking.user_id !== userId) {
        throw new AppError('Forbidden: you do not have access to this payment', 403);
      }
    }
    return payment;
  }

  async getPaymentHistory(userId, filters = {}) {
    try {
      const { status, startDate, endDate } = filters;
      const paymentWhere = {};

      if (status) {
        paymentWhere.status = status;
      }

      if (startDate || endDate) {
        paymentWhere.created_at = {};
        if (startDate) paymentWhere.created_at[Op.gte] = new Date(startDate);
        if (endDate) paymentWhere.created_at[Op.lte] = new Date(endDate);
      }

      const payments = await Payment.findAll({
        where: paymentWhere,
        include: [{
          model: Booking,
          as: 'booking',
          required: true,
          where: { user_id: userId },
          attributes: ['id', 'status', 'start_time', 'end_time'],
          include: [{
            model: Pet,
            as: 'pet',
            attributes: ['name', 'species']
          }]
        }],
        order: [['created_at', 'DESC']]
      });

      return payments;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get payment history', 500, { cause: error });
    }
  }
}

module.exports = new PaymentService();
