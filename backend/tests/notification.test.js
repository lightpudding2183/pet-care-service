const test = require('node:test');
const assert = require('node:assert/strict');

const { Notification } = require('../src/index');
const notificationRoutes = require('../src/routes/notif.routes');
const notifService = require('../src/services/notif.service');
const AppError = require('../src/utils/error');

async function withNotificationMocks(mocks, run) {
  const originals = [];
  for (const [method, replacement] of Object.entries(mocks)) {
    originals.push([method, Notification[method]]);
    Notification[method] = replacement;
  }
  try {
    await run();
  } finally {
    for (const [method, original] of originals.reverse()) {
      Notification[method] = original;
    }
  }
}

test('marking a notification read scopes lookup to its owner', async () => {
  let query;
  const notification = { read: false, save: async () => {} };

  await withNotificationMocks({
    findOne: async (options) => {
      query = options;
      return notification;
    }
  }, async () => {
    await notifService.markAsRead('notif-1', 'user-1');
  });

  assert.deepEqual(query.where, { id: 'notif-1', user_id: 'user-1' });
  assert.equal(notification.read, true);
});

test('marking another user notification read returns not found', async () => {
  await withNotificationMocks({ findOne: async () => null }, async () => {
    await assert.rejects(
      () => notifService.markAsRead('notif-1', 'user-2'),
      (error) => error instanceof AppError && error.statusCode === 404
    );
  });
});

test('deleting a notification scopes lookup to its owner', async () => {
  let query;
  let destroyed = false;
  const notification = { destroy: async () => { destroyed = true; } };

  await withNotificationMocks({
    findOne: async (options) => {
      query = options;
      return notification;
    }
  }, async () => {
    await notifService.deleteNotif('notif-1', 'user-1');
  });

  assert.deepEqual(query.where, { id: 'notif-1', user_id: 'user-1' });
  assert.equal(destroyed, true);
});

test('read filters preserve both true and false string values', async () => {
  const queries = [];
  await withNotificationMocks({
    findAndCountAll: async (options) => {
      queries.push(options);
      return { count: 0, rows: [] };
    }
  }, async () => {
    await notifService.getNotifsByUser('user-1', { read: 'false' });
    await notifService.getNotifsByUser('user-1', { read: 'true' });
  });

  assert.equal(queries[0].where.read, false);
  assert.equal(queries[1].where.read, true);
});

test('mark-read is PATCH-only and uses the explicit read path', () => {
  const routes = notificationRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));

  assert.ok(routes.some(({ path, methods }) => path === '/:notifId/read' && methods.patch));
  assert.ok(!routes.some(({ path, methods }) => path === '/:notifId' && methods.get));
});
