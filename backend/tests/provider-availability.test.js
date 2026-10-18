const test = require('node:test');
const assert = require('node:assert/strict');

const { Provider, Availability } = require('../src/index');
const { getAvailability } = require('../src/controllers/availability.controller');
const availabilityService = require('../src/services/availability.service');
const { createProviderSchema, availabilitySchema } = require('../src/validators/provider.validator');
const AppError = require('../src/utils/error');

test('Provider and Availability models are associated', () => {
  assert.ok(Provider.associations.availability, 'Provider should have a hasMany association to availability');
  assert.ok(Availability.associations.provider, 'Availability should have a belongsTo association to provider');
});

test('Availability controller reads provider id from the route param used by the app', async () => {
  const original = availabilityService.getAvailabilityByProviderId;
  let receivedProviderId;
  let receivedUserId;

  availabilityService.getAvailabilityByProviderId = async (providerId, userId) => {
    receivedProviderId = providerId;
    receivedUserId = userId;
    return { ok: true };
  };

  const req = {
    params: { id: 'provider-123' },
    user: { id: 'user-123' }
  };

  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await getAvailability(req, res);

  assert.equal(receivedProviderId, 'provider-123');
  assert.equal(receivedUserId, 'user-123');
  assert.equal(res.code, 200);
  assert.deepEqual(res.payload, { ok: true });

  availabilityService.getAvailabilityByProviderId = original;
});

test('Availability requests are validated before processing', () => {
  const { error } = availabilitySchema.validate({
    start_time: 'not-a-date',
    end_time: 'still-not-a-date'
  });

  assert.ok(error);
});

test('Availability service rejects non-owner access to a provider schedule', async () => {
  const originalFindByPk = Provider.findByPk;
  Provider.findByPk = async () => ({ id: 'provider-123', user_id: 'owner-1' });

  await assert.rejects(
    () => availabilityService.getAvailabilityByProviderId('provider-123', 'user-2'),
    (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 403);
      return true;
    }
  );

  Provider.findByPk = originalFindByPk;
});

test('Provider creation payload validation rejects incomplete data', () => {
  const { error } = createProviderSchema.validate({});
  assert.ok(error);
});
