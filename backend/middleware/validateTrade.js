const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to validate trade request payload prior to controller handling
 */
const validateTradePayload = (req, res, next) => {
  const { symbol, action, quantity, price } = req.body;

  if (!action || !['BUY', 'SELL', 'HOLD'].includes(String(action).toUpperCase())) {
    return errorResponse(res, 400, 'Trade action must be BUY, SELL, or HOLD', 'INVALID_ACTION');
  }

  const actUpper = String(action).toUpperCase();

  if (actUpper !== 'HOLD') {
    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      return errorResponse(res, 400, 'Valid stock symbol is required', 'INVALID_SYMBOL');
    }

    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0 || !Number.isInteger(numQty)) {
      return errorResponse(res, 400, 'Quantity must be a positive integer', 'INVALID_QUANTITY');
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return errorResponse(res, 400, 'Price must be a positive number', 'INVALID_PRICE');
    }
  }

  next();
};

module.exports = {
  validateTradePayload
};
