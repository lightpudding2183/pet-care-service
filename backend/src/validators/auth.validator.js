const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(5).max(100).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).pattern(/[A-Za-z]/).pattern(/[0-9]/).required()
    .messages({
      'string.pattern.base': 'Password must contain at least one letter and one number.',
      'string.min': 'Password must be at least 8 characters.',
			'string.empty': 'Password is required.'
    }),
  phone: Joi.string().trim().pattern(/^[0-9+\-\s]{8,20}$/).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };