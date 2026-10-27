const test = require('node:test');
const assert = require('node:assert/strict');
const avatarService = require('../src/services/avatar.service');
const AppError = require('../src/utils/error');

test('avatar upload URL rejects unsupported content types', async () => {
  await assert.rejects(
    () => avatarService.createUploadUrl('user-1', 'text/html'),
    (error) => error instanceof AppError && error.statusCode === 400
  );
});

test('avatar upload URL requires configured S3 bucket and region', async () => {
  const oldBucket = process.env.S3_BUCKET;
  const oldRegion = process.env.AWS_REGION;
  delete process.env.S3_BUCKET;
  delete process.env.AWS_REGION;
  try {
    await assert.rejects(
      () => avatarService.createUploadUrl('user-1', 'image/png'),
      (error) => error instanceof AppError && error.statusCode === 503
    );
  } finally {
    if (oldBucket === undefined) delete process.env.S3_BUCKET;
    else process.env.S3_BUCKET = oldBucket;
    if (oldRegion === undefined) delete process.env.AWS_REGION;
    else process.env.AWS_REGION = oldRegion;
  }
});
