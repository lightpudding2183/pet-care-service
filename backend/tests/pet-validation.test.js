const test = require('node:test');
const assert = require('node:assert/strict');

const { createPetSchema, updatePetSchema } = require('../src/validators/pet.validator');

test('pet schemas accept integer ages and an unspecified age', () => {
  assert.equal(createPetSchema.validate({ name: 'Milo', species: 'dog', age: 4 }).error, undefined);
  assert.equal(updatePetSchema.validate({ age: null }).error, undefined);
});

test('pet schemas reject fractional ages before reaching the database', () => {
  assert.ok(createPetSchema.validate({ name: 'Milo', species: 'dog', age: 1.5 }).error);
  assert.ok(updatePetSchema.validate({ age: 1.5 }).error);
});

test('pet update schema rejects empty updates', () => {
  assert.ok(updatePetSchema.validate({}).error);
});