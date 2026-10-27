const AppError = require('../utils/error');

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = new AppError('Validation failed.', 422);
      validationError.details = error.details.map((detail) => detail.message);
      return next(validationError);
    }

    req.body = value;
    next();
  };
}

module.exports = validateBody;