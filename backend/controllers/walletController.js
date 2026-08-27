const walletService = require('../services/walletService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class WalletController {
  /**
   * GET /api/wallet
   */
  async getWalletBalance(req, res, next) {
    try {
      const userId = req.user.userId;
      const balance = await walletService.getBalance(userId);
      return successResponse(res, 200, 'Wallet balance retrieved successfully', { balance });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/wallet/reset
   */
  async resetWalletBalance(req, res, next) {
    try {
      const userId = req.user.userId;
      const initialAmount = Number(req.body.initialAmount) || 100000;
      const balance = await walletService.resetBalance(userId, initialAmount);
      return successResponse(res, 200, `Wallet balance successfully reset to ₹${initialAmount}`, { balance });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WalletController();
