function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const code = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;
  const message = code === 500 ? 'Internal server error' : err.message;

  if (code >= 500) console.error(err.stack || err);

  const response = { error: message, code };
  if (Array.isArray(err.details)) response.details = err.details;
  return res.status(code).json(response);
}

module.exports = errorHandler;