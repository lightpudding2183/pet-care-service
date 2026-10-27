const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/error');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized: Missing or malformed token', 401));
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return next(new AppError(message, 401));
  }

  try {
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'email']
    });
    if (!user) return next(new AppError('Invalid token', 401));
    req.user = user.toJSON();
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = requireAuth;
