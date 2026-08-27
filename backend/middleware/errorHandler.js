const { errorResponse } = require('../utils/apiResponse');

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Global Error] ${err.message}`, err.stack);

  const statusCode = err.statusCode || (err.code === 'INSUFFICIENT_BALANCE' || err.code === 'INSUFFICIENT_HOLDINGS' ? 400 : 500);
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  return errorResponse(res, statusCode, err.message || 'An internal server error occurred', errorCode);
};

module.exports = errorHandler;
