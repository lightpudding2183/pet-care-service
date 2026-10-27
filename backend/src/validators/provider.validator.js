const Joi = require('joi');

const createProviderSchema = Joi.object({
  business_name: Joi.string().trim().min(2).max(200).required(),
  address: Joi.string().trim().min(5).max(500).required(),
  verification_document_url: Joi.string().uri().allow('').optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
}).required();

const updateProviderSchema = Joi.object({
  business_name: Joi.string().trim().min(2).max(200).optional(),
  address: Joi.string().trim().min(5).max(500).optional(),
  verification_document_url: Joi.string().uri().allow('').optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
}).min(1).required();

const availabilitySchema = Joi.object({
  date: Joi.date().required(),
  start_time: Joi.date().required(),
  end_time: Joi.date().greater(Joi.ref('start_time')).required(),
  is_recurring: Joi.boolean().optional()
}).required();

module.exports = {
  createProviderSchema,
  updateProviderSchema,
  availabilitySchema
};
