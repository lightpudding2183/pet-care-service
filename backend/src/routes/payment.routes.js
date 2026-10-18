const express = require('express');
const router = express.Router();

const {
  createPayment,
  getPaymentStatus,
  updatePaymentStatus,
  processRefund,
  getPaymentsHistory
} = require('../controllers/payment.controller');
const requireAuth = require('../middlewares/auth.middleware');

router.post('/', requireAuth, createPayment);
router.get('/', requireAuth, getPaymentsHistory);
router.get('/:paymentId', requireAuth, getPaymentStatus);
router.put('/:paymentId/status', requireAuth, updatePaymentStatus);
router.post('/:paymentId/refund', requireAuth, processRefund);

module.exports = router;
