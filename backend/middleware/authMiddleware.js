const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches decoded user to req.user.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Authentication token required', 'TOKEN_REQUIRED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 401, 'Authentication token required', 'TOKEN_REQUIRED');
    }

    const jwtSecret = process.env.JWT_SECRET || 'paper_pulse_jwt_secret_key_2026_antigravity';

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        name: decoded.name
      };
      next();
    } catch (err) {
      return errorResponse(res, 401, 'Invalid or expired token', 'INVALID_TOKEN');
    }
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
};

/**
 * Optional Auth Middleware
 * Extracts JWT if present, but does not block unauthenticated requests.
 * Useful for backward compatibility with automated test scripts.
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET || 'paper_pulse_jwt_secret_key_2026_antigravity';
      const decoded = jwt.verify(token, jwtSecret);
      req.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        name: decoded.name
      };
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
