const AppError = require('../../errors/appError');

function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    const { status, body } = err.toHttp();
    return res.status(status).json(body);
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
