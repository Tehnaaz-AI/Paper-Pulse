// MOCK - Replace signal ingestion with Nilay's real AI signal service when available
const tradingService = require('./tradingService');
const mockSignalProvider = require('../mocks/mockSignalProvider');

class AutoTradingService {
  constructor() {
    // Processed signal hash tracker to guard against duplicate automatic trades
    this.processedSignalHashes = new Set();
  }

  /**
   * Generates a deterministic hash for an incoming signal to prevent duplicate executions
   */
  _generateSignalHash(signal) {
    if (signal.signalId) return signal.signalId;
    const timestampKey = signal.timestamp ? new Date(signal.timestamp).getTime() : '';
    return `${signal.symbol}:${signal.action}:${signal.price}:${signal.quantity}:${timestampKey}`;
  }

  /**
   * Validates structure of an incoming AI Signal
   */
  validateSignal(signal) {
    if (!signal || typeof signal !== 'object') {
      const err = new Error('Invalid signal payload format');
      err.code = 'INVALID_SIGNAL_FORMAT';
      throw err;
    }

    const { symbol, action, price, quantity } = signal;

    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      const err = new Error('Signal missing valid stock symbol');
      err.code = 'INVALID_SIGNAL_SYMBOL';
      throw err;
    }

    if (!action || !['BUY', 'SELL', 'HOLD'].includes(String(action).toUpperCase())) {
      const err = new Error('Signal action must be BUY, SELL, or HOLD');
      err.code = 'INVALID_SIGNAL_ACTION';
      throw err;
    }

    const actUpper = String(action).toUpperCase();

    if (actUpper !== 'HOLD') {
      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
        const err = new Error('Signal quantity must be a positive integer');
        err.code = 'INVALID_SIGNAL_QUANTITY';
        throw err;
      }

      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        const err = new Error('Signal price must be a positive number');
        err.code = 'INVALID_SIGNAL_PRICE';
        throw err;
      }
    }

    return true;
  }

  /**
   * Process incoming AI signal and execute automatic paper trade
   * 
   * @param {Object} signal - Signal object from Nilay's AI model or mock provider
   * @param {string} userId - User ID
   */
  async processSignal(signal, userId = 'default_user') {
    // 1. Validate Signal Payload
    this.validateSignal(signal);

    // 2. Duplicate Signal Protection
    const signalHash = this._generateSignalHash(signal);
    if (signal.preventDuplicates && this.processedSignalHashes.has(signalHash)) {
      const err = new Error('Duplicate automatic trade signal detected and suppressed');
      err.code = 'DUPLICATE_SIGNAL';
      throw err;
    }

    // 3. Forward to core execution engine with tradeType = 'AUTOMATIC'
    const result = await tradingService.executeTrade({
      userId,
      symbol: signal.symbol,
      action: signal.action,
      quantity: signal.quantity,
      price: signal.price,
      signal: signal.signal || signal.action,
      tradeType: 'AUTOMATIC'
    });

    // Record signal hash if trade processed successfully
    this.processedSignalHashes.add(signalHash);

    return result;
  }

  /**
   * Triggers a test signal from the Mock Signal Provider
   */
  async triggerMockSignal(symbol = 'TCS', action = 'BUY', userId = 'default_user') {
    const mockSignal = mockSignalProvider.getSignal(symbol, action);
    return this.processSignal(mockSignal, userId);
  }

  /**
   * Reset duplicate tracker for tests
   */
  clearDuplicatesTracker() {
    this.processedSignalHashes.clear();
  }
}

module.exports = new AutoTradingService();
