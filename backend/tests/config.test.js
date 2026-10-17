const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = '../src/config/database';

test('database config throws a clear error when DATABASE_URL is blank', () => {
  process.env.DATABASE_URL = '';
  delete require.cache[require.resolve(databaseModulePath)];

  assert.throws(
    () => require(databaseModulePath),
    /DATABASE_URL.*backend\/\.env/i,
  );
});
