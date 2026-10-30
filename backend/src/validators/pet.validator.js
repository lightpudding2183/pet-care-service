const Joi = require('joi');

const petFields = {
  name: Joi.string().trim().min(1).max(50),
  species: Joi.string().trim().min(1).max(100),
  breed: Joi.string().trim().max(100).allow(null, ''),
  age: Joi.number().integer().min(0).max(40).allow(null)
};

const createPetSchema = Joi.object({
  ...petFields,
  name: petFields.name.required(),
  species: petFields.species.required()
}).required();

const updatePetSchema = Joi.object(petFields).min(1).required();

module.exports = { createPetSchema, updatePetSchema };