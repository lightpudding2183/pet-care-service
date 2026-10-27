require('dotenv').config();

const secret = process.env.JWT_ACCESS_SECRET;
if (!secret) {
  throw new Error('Missing JWT_ACCESS_SECRET in backend/.env.');
}

module.exports = {
  secret,
  expiresIn: process.env.JWT_EXPIRES_IN || '24h'
};