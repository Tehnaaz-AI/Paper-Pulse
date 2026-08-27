const tradingService = require('../services/tradingService');
const autoTradingService = require('../services/autoTradingService');
const tradeHistoryService = require('../services/tradeHistoryService');
const csvStockService = require('../services/csvStockService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class TradeController {
  /**
   * Helper to resolve target user ID (strictly extracts from JWT authenticated token)
   */
  _resolveUserId(req) {
    if (req.user && req.user.userId) {
      return req.user.userId;
    }
    const err = new Error('Authentication is required to perform this action');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  /**
   * Execute a manual trade
   * POST /api/trades/execute
   */
  async executeManualTrade(req, res, next) {
    try {
      const { symbol, action, quantity, price, signal } = req.body;
      const userId = this._resolveUserId(req);

      const result = await tradingService.executeTrade({
        userId,
        symbol,
        action,
        quantity,
        price,
        signal: signal || action,
        tradeType: 'MANUAL'
      });

      const message = result.action === 'HOLD' 
        ? 'HOLD action processed successfully' 
        : `Manual ${result.action} trade executed successfully`;

      return successResponse(res, 200, message, result);
    } catch (error) {
      if (['INSUFFICIENT_BALANCE', 'INSUFFICIENT_HOLDINGS', 'INVALID_ACTION', 'INVALID_QUANTITY', 'INVALID_PRICE', 'INVALID_SYMBOL'].includes(error.code)) {
        return errorResponse(res, 400, error.message, error.code);
      }
      next(error);
    }
  }

  /**
   * Process an automatic AI signal paper trade
   * POST /api/trades/auto-signal
   */
  async executeAutoTrade(req, res, next) {
    try {
      const userId = this._resolveUserId(req);
      let signal = req.body;

      // If the request specifies only a symbol (and optionally quantity),
      // resolve the action, price, and model details dynamically from the live Python ML prediction API
      if (signal.symbol && (!signal.action || !signal.price)) {
        const symbol = signal.symbol.trim().toUpperCase();
        const quantity = Number(signal.quantity) || 10;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const mlResponse = await fetch(`http://127.0.0.1:8000/predict/${symbol}`, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (mlResponse.ok) {
            const mlResult = await mlResponse.json();
            signal = {
              symbol: mlResult.symbol,
              action: mlResult.signal,
              price: mlResult.current_price,
              quantity: quantity,
              signal: mlResult.signal,
              timestamp: mlResult.generated_at,
              modelName: mlResult.model,
              confidence: Math.round((mlResult.prediction === 'UP' ? mlResult.probability_up : mlResult.probability_down) * 100),
              preventDuplicates: req.body.preventDuplicates !== false
            };
          }
        } catch (err) {
          console.warn(`[AutoTrade Warning] Python FastAPI service offline at http://127.0.0.1:8000/predict/${symbol}: ${err.message}. Using default mock backup signal.`);
          
          const latestPrice = csvStockService.getLatestPrice(symbol);
          signal = {
            symbol,
            action: 'BUY',
            price: latestPrice,
            quantity: quantity,
            signal: 'BUY',
            timestamp: new Date().toISOString(),
            modelName: 'MockModelFallback',
            confidence: 75,
            preventDuplicates: req.body.preventDuplicates !== false
          };
        }
      }

      const result = await autoTradingService.processSignal(signal, userId);

      const message = result.action === 'HOLD'
        ? 'Automatic HOLD signal processed successfully'
        : `Automatic ${result.action} paper trade executed successfully`;

      return successResponse(res, 200, message, result);
    } catch (error) {
      if (['INSUFFICIENT_BALANCE', 'INSUFFICIENT_HOLDINGS', 'INVALID_SIGNAL_FORMAT', 'INVALID_SIGNAL_SYMBOL', 'INVALID_SIGNAL_ACTION', 'INVALID_SIGNAL_QUANTITY', 'INVALID_SIGNAL_PRICE', 'DUPLICATE_SIGNAL'].includes(error.code)) {
        return errorResponse(res, 400, error.message, error.code);
      }
      next(error);
    }
  }

  /**
   * Retrieve trade history (all or filtered by symbol parameter)
   * GET /api/trades
   * GET /api/trades/:symbol
   */
  async getTradeHistory(req, res, next) {
    try {
      const { symbol } = req.params;
      const userId = this._resolveUserId(req);

      const trades = await tradeHistoryService.getTradeHistory(userId, symbol);

      return successResponse(res, 200, 'Trade history retrieved successfully', trades);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TradeController();
