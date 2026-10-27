const test = require('node:test');
const assert = require('node:assert/strict');

const asyncHandler = require('../src/utils/asyncHandler');
const errorHandler = require('../src/middlewares/errorHandler');
const validateBody = require('../src/middlewares/validate');
const AppError = require('../src/utils/error');
const Joi = require('joi');

function createResponse(headersSent = false) {
  return {
    headersSent,
    statusCalls: [],
    status(code) {
      this.statusCalls.push(code);
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('central handler sends one response for an AppError with { error, code }', () => {
  const response = createResponse();
  errorHandler(new AppError('Not found', 404), {}, response, () => {});

  assert.deepEqual(response.statusCalls, [404]);
  assert.deepEqual(response.body, { error: 'Not found', code: 404 });
});

test('central handler masks unexpected errors and includes validation details', () => {
  const response = createResponse();
  const error = new Error('database password leaked');
  error.details = ['field is required'];
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    errorHandler(error, {}, response, () => {});
  } finally {
    console.error = originalConsoleError;
  }

  assert.deepEqual(response.statusCalls, [500]);
  assert.deepEqual(response.body, {
    error: 'Internal server error',
    code: 500,
    details: ['field is required']
  });
});

test('central handler delegates after headers have been sent', () => {
  const response = createResponse(true);
  let forwarded;
  const error = new Error('stream failure');
  errorHandler(error, {}, response, (nextError) => { forwarded = nextError; });

  assert.equal(forwarded, error);
  assert.deepEqual(response.statusCalls, []);
});

test('asyncHandler forwards rejected promises to Express next', async () => {
  const expected = new Error('async failure');
  let forwarded;
  const wrapped = asyncHandler(async () => { throw expected; });
  wrapped({}, {}, (error) => { forwarded = error; });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(forwarded, expected);
});

test('validation middleware forwards standardized errors with details', () => {
  const middleware = validateBody(Joi.object({ name: Joi.string().required() }));
  let forwarded;
  middleware({ body: {} }, {}, (error) => { forwarded = error; });

  assert.equal(forwarded.statusCode, 422);
  assert.equal(forwarded.message, 'Validation failed.');
  assert.ok(Array.isArray(forwarded.details));
});
