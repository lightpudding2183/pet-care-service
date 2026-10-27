const paymentService = require('../services/payment.service');
const stripeService = require('../services/stripe.service');
const { Booking } = require('../index');
const AppError = require('../utils/error');
const asyncHandler = require('../utils/asyncHandler');

const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, booking_id, method, service_id } = req.body;
  const resolvedBookingId = booking_id || bookingId;
  if (!resolvedBookingId || !method) throw new AppError('Missing required payment fields', 400);

  const booking = await Booking.findByPk(resolvedBookingId);
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
  }

  const result = await paymentService.createPayment({ booking_id: resolvedBookingId, method, service_id });
  res.status(201).json(result);
});

const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const event = stripeService.constructEvent(req.body, signature);
  const result = await stripeService.handleWebhookEvent(event);
  res.status(200).json({ received: true, ...result });
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  const paymentDetails = await paymentService.getPaymentStatus(req.params.paymentId, req.user.id, req.user.role);
  res.status(200).json(paymentDetails);
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin access required', 403);
  const updatedPayment = await paymentService.updatePaymentStatus(req.params.paymentId, req.body);
  res.status(200).json(updatedPayment);
});

const processRefund = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') throw new AppError('Admin access required', 403);
  const payment = await paymentService.processRefund(req.params.paymentId);
  res.status(200).json(payment);
});

const getPaymentsHistory = asyncHandler(async (req, res) => {
  const { status, startDate, endDate } = req.query;
  const payments = await paymentService.getPaymentHistory(req.user.id, { status, startDate, endDate });
  res.status(200).json({ payments, count: payments.length });
});

module.exports = {
  createPayment,
  handleStripeWebhook,
  getPaymentStatus,
  updatePaymentStatus,
  processRefund,
  getPaymentsHistory
};
