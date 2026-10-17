const express = require('express');
const router = express.Router();

const { register, login, logout } = require('../controllers/auth.controller');
const rateLimiter = require('../middlewares/rateLimiter');
const requireAuth = require('../middlewares/auth.middleware');
const validateBody = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

router.post('/register', rateLimiter, validateBody(registerSchema), register);
router.post('/login', rateLimiter, validateBody(loginSchema), login);
router.post('/logout', rateLimiter, requireAuth, logout);

// Example of a protected route
router.get('/protected', requireAuth, (req, res) => {
  res.status(200).json({ message: 'You have accessed a protected route!' });
});

module.exports = router;