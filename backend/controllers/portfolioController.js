const portfolioService = require('../services/portfolioService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class PortfolioController {
  /**
   * GET /api/portfolio
   */
  async getPortfolioHoldings(req, res, next) {
    try {
      const userId = req.user.userId;
      const holdings = await portfolioService.getPortfolio(userId);
      return successResponse(res, 200, 'Portfolio holdings retrieved successfully', holdings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/portfolio/:symbol
   */
  async getHoldingBySymbol(req, res, next) {
    try {
      const userId = req.user.userId;
      const { symbol } = req.params;
      
      const holding = await portfolioService.getHolding(userId, symbol);
      if (!holding) {
        return successResponse(res, 200, `No active holdings found for stock symbol '${symbol.toUpperCase()}'`, null);
      }
      return successResponse(res, 200, `Holding for symbol ${symbol.toUpperCase()} retrieved successfully`, holding);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PortfolioController();
