function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });

  if (err.statusCode) {
    res.status(err.statusCode).json({ message: err.message });
  }
}

module.exports = errorHandler;