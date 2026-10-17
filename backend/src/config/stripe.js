require('dotenv').config();
const Stripe = require('stripe');

let stripeClient = null;

function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}

module.exports = { getStripe };
