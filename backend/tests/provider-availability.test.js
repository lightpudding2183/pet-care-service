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

  availabilityService.getAvailabilityByProviderId = async (providerId) => {
    receivedProviderId = providerId;
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

test('Availability service allows non-owners to read a provider schedule', async () => {
  const originalFindByPk = Provider.findByPk;
  const originalFindAll = Availability.findAll;
  Provider.findByPk = async () => ({ id: 'provider-123', user_id: 'owner-1' });
  Availability.findAll = async () => [{ provider_id: 'provider-123' }];

  const availability = await availabilityService.getAvailabilityByProviderId('provider-123');

  Provider.findByPk = originalFindByPk;
  Availability.findAll = originalFindAll;
  assert.deepEqual(availability, [{ provider_id: 'provider-123' }]);
});

test('Availability service expands recurring templates into upcoming dated windows', async () => {
  const originalFindByPk = Provider.findByPk;
  const originalFindAll = Availability.findAll;
  const now = new Date();
  const targetDay = (now.getUTCDay() + 1) % 7;
  const templateDate = new Date(Date.UTC(2026, 0, 1));
  templateDate.setUTCDate(templateDate.getUTCDate() + ((targetDay - templateDate.getUTCDay() + 7) % 7));
  const start = new Date(templateDate);
  start.setUTCHours(9, 0, 0, 0);
  const end = new Date(templateDate);
  end.setUTCHours(17, 0, 0, 0);
  Provider.findByPk = async () => ({ id: 'provider-123' });
  Availability.findAll = async () => [{
    id: 'weekly-window',
    provider_id: 'provider-123',
    date: templateDate,
    start_time: start,
    end_time: end,
    is_recurring: true
  }];

  try {
    const windows = await availabilityService.getAvailabilityByProviderId('provider-123');
    assert.ok(windows.length > 0);
    assert.ok(windows.every((window) => new Date(window.end_time) > now));
    assert.ok(windows.every((window) => window.id.startsWith('weekly-window-')));
  } finally {
    Provider.findByPk = originalFindByPk;
    Availability.findAll = originalFindAll;
  }
});

test('Provider creation payload validation rejects incomplete data', () => {
  const { error } = createProviderSchema.validate({});
  assert.ok(error);
});
