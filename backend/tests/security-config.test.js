const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Provider, User, sequelize } = require('../src/index');
const authService = require('../src/services/auth.service');
const providerService = require('../src/services/provider.service');
const userService = require('../src/services/user.service');
const jwtConfig = require('../src/config/jwt');
const { createProviderSchema, updateProviderSchema } = require('../src/validators/provider.validator');
const { updateProfileSchema, changePasswordSchema } = require('../src/validators/user.validator');

async function withProviderMocks(mocks, run) {
  const models = { Provider, User };
  const originals = [];
  for (const [modelName, methods] of Object.entries(mocks)) {
    const model = models[modelName];
    for (const [method, replacement] of Object.entries(methods)) {
      originals.push([model, method, model[method]]);
      model[method] = replacement;
    }
  }

  const originalTransaction = sequelize.transaction;
  sequelize.transaction = async (callback) => callback({ LOCK: { UPDATE: 'UPDATE' } });
  try {
    await run();
  } finally {
    sequelize.transaction = originalTransaction;
    for (const [model, method, original] of originals.reverse()) {
      model[method] = original;
    }
  }
}

test('JWT config requires an access secret and uses the configured expiry', () => {
  assert.ok(jwtConfig.secret);
  assert.equal(jwtConfig.expiresIn, process.env.JWT_EXPIRES_IN || '24h');
});

test('login signs tokens with the shared secret and configured expiry', async () => {
  const originalFindOne = User.findOne;
  const originalCompare = bcrypt.compare;
  const originalSign = jwt.sign;
  let signOptions;
  User.findOne = async () => ({
    id: 'user-1',
    role: 'user',
    password_hash: 'hash'
  });
  bcrypt.compare = async () => true;
  jwt.sign = (_payload, secret, options) => {
    assert.equal(secret, jwtConfig.secret);
    signOptions = options;
    return 'signed-token';
  };

  try {
    const result = await authService.login('user@example.com', 'password');
    assert.equal(result.token, 'signed-token');
    assert.equal(signOptions.expiresIn, jwtConfig.expiresIn);
  } finally {
    User.findOne = originalFindOne;
    bcrypt.compare = originalCompare;
    jwt.sign = originalSign;
  }
});

test('provider create schema strips client-controlled verification and rating fields', () => {
  const { value, error } = createProviderSchema.validate({
    business_name: 'Care Co',
    address: '123 Main Street',
    verified: true,
    rating_avg: 5,
    rating_count: 100
  }, { stripUnknown: true });

  assert.ifError(error);
  assert.deepEqual(value, { business_name: 'Care Co', address: '123 Main Street' });
});

test('provider update schema strips client-controlled verification and rating fields', () => {
  const { error } = updateProviderSchema.validate({ verified: true, rating_avg: 5 }, { stripUnknown: true });
  assert.ok(error, 'server-owned fields alone must not make a valid update');
});

test('provider creation ignores client-controlled verification and rating fields', async () => {
  let createdData;
  const user = { id: 'user-1', role: 'user', save: async () => {} };

  await withProviderMocks({
    User: { findByPk: async () => user },
    Provider: {
      findOne: async () => null,
      create: async (data) => {
        createdData = data;
        return data;
      }
    }
  }, async () => {
    await providerService.createProvider({
      business_name: 'Care Co',
      address: '123 Main Street',
      verified: true,
      rating_avg: 5,
      rating_count: 100
    }, 'user-1');
  });

  assert.deepEqual(createdData, {
    business_name: 'Care Co',
    address: '123 Main Street',
    verification_document_url: undefined,
    latitude: undefined,
    longitude: undefined,
    user_id: 'user-1'
  });
});

test('provider updates ignore client-controlled verification and rating fields', async () => {
  let updatedData;
  const provider = {
    user_id: 'user-1',
    update: async (data) => { updatedData = data; }
  };

  await withProviderMocks({
    Provider: { findByPk: async () => provider }
  }, async () => {
    await providerService.updateProvider('provider-1', {
      address: '456 Oak Street',
      verified: true,
      rating_avg: 5,
      rating_count: 100
    }, 'user-1');
  });

  assert.deepEqual(updatedData, { address: '456 Oak Street' });
});

test('profile updates return the updated user object', async () => {
  const originalUpdate = User.update;
  const originalFindByPk = User.findByPk;
  const updatedProfile = { id: 'user-1', email: 'user@example.com', full_name: 'New Name' };
  User.update = async () => [1];
  User.findByPk = async () => updatedProfile;
  try {
    const result = await userService.updateProfile('user-1', { full_name: 'New Name' });
    assert.equal(result, updatedProfile);
  } finally {
    User.update = originalUpdate;
    User.findByPk = originalFindByPk;
  }
});

test('profile schema requires avatar_url to be a valid HTTP URI', () => {
  assert.ok(updateProfileSchema.validate({ avatar_url: 'not a url' }).error);
  assert.ok(updateProfileSchema.validate({ avatar_url: 'https://cdn.example.com/avatar.png' }).error === undefined);
});

test('change-password schema requires current password and a strong-length new password', () => {
  assert.ok(changePasswordSchema.validate({ currentPassword: 'old' }).error);
  assert.ok(changePasswordSchema.validate({ currentPassword: 'old', newPassword: 'short' }).error);
  assert.equal(changePasswordSchema.validate({ currentPassword: 'old', newPassword: 'long-enough-password' }).error, undefined);
});

test('change password verifies current hash and replaces it with a new hash', async () => {
  const bcrypt = require('bcrypt');
  const originalFindByPk = User.findByPk;
  const user = {
    password_hash: 'old-hash',
    save: async () => {}
  };
  const originalCompare = bcrypt.compare;
  const originalHash = bcrypt.hash;
  bcrypt.compare = async (plain, hash) => plain === 'old-password' && hash === 'old-hash';
  bcrypt.hash = async (plain) => `hashed:${plain}`;
  User.findByPk = async () => user;
  try {
    await userService.changePassword('user-1', {
      currentPassword: 'old-password',
      newPassword: 'new-password'
    });
    assert.equal(user.password_hash, 'hashed:new-password');
  } finally {
    User.findByPk = originalFindByPk;
    bcrypt.compare = originalCompare;
    bcrypt.hash = originalHash;
  }
});
