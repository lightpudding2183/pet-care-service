const Joi = require('joi');

const updateProfileSchema = Joi.object({
  phone: Joi.string().trim().max(30).allow('', null),
  full_name: Joi.string().trim().min(2).max(200).allow('', null),
  avatar_url: Joi.string().uri({ scheme: ['http', 'https'] }).allow('', null)
}).min(1).required();

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
}).required();

const avatarUploadSchema = Joi.object({
  contentType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required()
}).required();

module.exports = { updateProfileSchema, changePasswordSchema, avatarUploadSchema };