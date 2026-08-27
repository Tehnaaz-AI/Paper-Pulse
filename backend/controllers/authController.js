const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const user = await authService.registerUser({ name, email, password });
      return successResponse(res, 201, 'User registered successfully', user);
    } catch (error) {
      if (error.code === 'DUPLICATE_EMAIL') {
        return errorResponse(res, 409, error.message, 'DUPLICATE_EMAIL');
      }
      if (['INVALID_NAME', 'INVALID_EMAIL', 'INVALID_PASSWORD'].includes(error.code)) {
        return errorResponse(res, 400, error.message, error.code);
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser({ email, password });
      return successResponse(res, 200, 'Login successful', result);
    } catch (error) {
      if (error.code === 'INVALID_CREDENTIALS') {
        return errorResponse(res, 401, error.message, 'INVALID_CREDENTIALS');
      }
      next(error);
    }
  }

  /**
   * GET /api/auth/me (Protected)
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await authService.getUserProfile(userId);
      return successResponse(res, 200, 'User profile retrieved successfully', { user });
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') {
        return errorResponse(res, 404, error.message, 'USER_NOT_FOUND');
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
