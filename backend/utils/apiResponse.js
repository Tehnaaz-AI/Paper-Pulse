/**
 * API Response Formatter Utility
 * Enforces standardized success and error JSON response structures across all controllers.
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode = 400, message = 'An error occurred', errorCode = 'BAD_REQUEST', details = null) => {
  const response = {
    success: false,
    message,
    error: errorCode
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
