const test = require('node:test');
const assert = require('node:assert/strict');

const { Availability, Provider, ProviderServices, User } = require('../src/index');
const providerRoutes = require('../src/routes/provider.routes');
const searchService = require('../src/services/search.service');
const AppError = require('../src/utils/error');

const originalFindAndCountAll = Provider.findAndCountAll;

test.afterEach(() => {
  Provider.findAndCountAll = originalFindAndCountAll;
});

test('search returns paginated verified providers with requested service and availability filters', async () => {
  let query;
  Provider.findAndCountAll = async (options) => {
    query = options;
    return { count: 3, rows: [{ id: 'provider-1' }] };
  };

  const result = await searchService.searchProviders({
    lat: '37.7749',
    lng: '-122.4194',
    radiusKm: '25',
    serviceId: 'service-1',
    minRating: '4',
    from: '2026-11-01T10:00:00Z',
    to: '2026-11-01T12:00:00Z',
    page: '2',
    limit: '1'
  });

  assert.deepEqual(result, {
    providers: [{ id: 'provider-1' }],
    total: 3,
    page: 2,
    totalPages: 3
  });
  assert.equal(query.where.verified, true);
  assert.equal(query.where.rating_avg[Object.getOwnPropertySymbols(query.where.rating_avg)[0]], 4);
  assert.equal(query.limit, 1);
  assert.equal(query.offset, 1);
  assert.equal(query.distinct, true);
  assert.ok(query.attributes.include[0][0].val.includes('acos'));
  assert.ok(query.where[Object.getOwnPropertySymbols(query.where)[0]][0].val.includes('<= 25'));

  const serviceJoin = query.include.find((include) => include.model === ProviderServices);
  assert.deepEqual(serviceJoin.attributes, ['id', 'provider_id', 'service_id', 'price']);
  assert.equal(serviceJoin.required, true);
  assert.deepEqual(serviceJoin.where, { service_id: 'service-1' });
  const userJoin = query.include.find((include) => include.model === User && include.as === 'user');
  assert.deepEqual(userJoin.attributes, ['id', 'full_name', 'avatar_url']);
  assert.equal(userJoin.model, User);
  assert.equal(userJoin.as, 'user');
  assert.doesNotThrow(() => Provider._validateIncludedElements({ model: Provider, include: [userJoin] }));
  const availabilityJoin = query.include.find((include) => include.model === Availability);
  assert.equal(availabilityJoin.required, true);
  assert.ok(availabilityJoin.where.start_time);
  assert.ok(availabilityJoin.where.end_time);
  assert.equal(query.order.length, 2);
});

test('search supports one-sided availability time bounds', async () => {
  let query;
  Provider.findAndCountAll = async (options) => {
    query = options;
    return { count: 0, rows: [] };
  };

  await searchService.searchProviders({ from: '2026-11-01T10:00:00Z' });
  const availabilityJoin = query.include.find((include) => include.model === Availability);
  assert.ok(availabilityJoin.where.end_time);
  assert.equal(availabilityJoin.where.start_time, undefined);
});

test('search validates coordinates, radius, rating, and pagination before querying', async () => {
  Provider.findAndCountAll = async () => assert.fail('invalid filters must not query the database');
  const invalidFilters = [
    { lat: 'nope', lng: '0' },
    { lat: '1' },
    { radiusKm: '5' },
    { minRating: '6' },
    { page: '0' },
    { limit: '101' },
    { from: 'not-a-date' }
  ];

  for (const filters of invalidFilters) {
    await assert.rejects(
      () => searchService.searchProviders(filters),
      (error) => error instanceof AppError && error.statusCode === 400
    );
  }
});

test('provider search route is registered before the provider id route', () => {
  const paths = providerRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => layer.route.path);
  assert.ok(paths.indexOf('/search') < paths.indexOf('/:id'));
});
