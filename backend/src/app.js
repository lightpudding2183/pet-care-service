const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const petRoutes = require('./routes/pet.routes');
const providerRoutes = require('./routes/provider.routes');
const bookingRoutes = require('./routes/booking.routes');
const verificationRoutes = require('./routes/admin.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const notifRoutes = require('./routes/notif.routes');
const { handleStripeWebhook } = require('./controllers/payment.controller');

const app = express();

// Middleware
app.use(cors());

// Stripe webhooks require the raw body for signature verification.
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admins', verificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/notification', notifRoutes);

app.get('/health', (req,res) => res.json({ status: 'UP' }));

app.use(errorHandler);

module.exports = app;