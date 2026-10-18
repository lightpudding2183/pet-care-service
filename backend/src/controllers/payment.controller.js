const paymentService = require('../services/payment.service');
const stripeService = require('../services/stripe.service');
const { Booking } = require('../index');
const AppError = require('../utils/error');

async function createPayment(req, res) {
  try {
    const { bookingId, booking_id, method, service_id } = req.body;
    const resolvedBookingId = booking_id || bookingId;
    const userId = req.user.id;

    if (!resolvedBookingId || !method) {
      return res.status(400).json({ error: 'Missing required payment fields' });
    }

    const booking = await Booking.findByPk(resolvedBookingId, {
      include: [{ association: 'user' }]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isOwner = booking.user_id === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await paymentService.createPayment({
      booking_id: resolvedBookingId,
      method,
      service_id
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

async function handleStripeWebhook(req, res) {
  try {
    const signature = req.headers['stripe-signature'];
    const event = stripeService.constructEvent(req.body, signature);
    const result = await stripeService.handleWebhookEvent(event);
    res.status(200).json({ received: true, ...result });
  } catch (error) {
    console.error('Stripe webhook error:', error.message);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(400).json({ error: 'Webhook handler failed' });
  }
}

async function getPaymentStatus(req, res) {
  try {
    const paymentId = req.params.paymentId;
    const paymentDetails = await paymentService.getPaymentStatus(paymentId, req.user.id, req.user.role);
    res.status(200).json(paymentDetails);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const paymentId = req.params.paymentId;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const updatedPayment = await paymentService.updatePaymentStatus(paymentId, req.body);
    res.status(200).json(updatedPayment);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function processRefund(req, res) {
  try {
    const paymentId = req.params.paymentId;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const payment = await paymentService.processRefund(paymentId);
    res.status(200).json(payment);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

async function getPaymentsHistory(req, res) {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate } = req.query;
    const payments = await paymentService.getPaymentHistory(userId, {
      status,
      startDate,
      endDate
    });
    res.status(200).json({
      payments,
      count: payments.length
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = {
  createPayment,
  handleStripeWebhook,
  getPaymentStatus,
  updatePaymentStatus,
  processRefund,
  getPaymentsHistory
};
