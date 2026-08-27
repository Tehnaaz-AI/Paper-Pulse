const walletService = require('./walletService');
const portfolioService = require('./portfolioService');
const tradeHistoryService = require('./tradeHistoryService');

class TradingService {
  /**
   * Unified Trade Execution Engine for BUY, SELL, and HOLD actions.
   * Handles both MANUAL and AUTOMATIC paper trades.
   * 
   * @param {Object} tradePayload
   * @param {string} tradePayload.userId
   * @param {string} tradePayload.symbol
   * @param {string} tradePayload.action - BUY | SELL | HOLD
   * @param {number} tradePayload.quantity
   * @param {number} tradePayload.price
   * @param {string} [tradePayload.signal] - AI Signal string or BUY/SELL/HOLD
   * @param {string} [tradePayload.tradeType] - MANUAL | AUTOMATIC
   */
  async executeTrade({
    userId = 'default_user',
    symbol,
    action,
    quantity,
    price,
    signal,
    tradeType = 'MANUAL'
  }) {
    // 1. Input Normalization & Sanity Validation
    if (!action || !['BUY', 'SELL', 'HOLD'].includes(action.toUpperCase())) {
      const error = new Error('Invalid trade action. Allowed actions: BUY, SELL, HOLD');
      error.code = 'INVALID_ACTION';
      throw error;
    }

    const normalizedAction = action.toUpperCase();

    // 2. Handle HOLD Logic
    if (normalizedAction === 'HOLD') {
      const currentWalletBalance = await walletService.getBalance(userId);
      const currentHolding = symbol ? await portfolioService.getHolding(userId, symbol) : null;

      return {
        executed: false,
        action: 'HOLD',
        message: 'HOLD signal processed. No changes executed on wallet or portfolio.',
        trade: null,
        walletBalance: currentWalletBalance,
        holding: currentHolding
      };
    }

    // 3. Validation for BUY and SELL
    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      const error = new Error('Valid stock symbol is required');
      error.code = 'INVALID_SYMBOL';
      throw error;
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
      const error = new Error('Quantity must be a positive integer');
      error.code = 'INVALID_QUANTITY';
      throw error;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      const error = new Error('Price must be a positive number');
      error.code = 'INVALID_PRICE';
      throw error;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const totalValue = Math.round(numQuantity * numPrice * 100) / 100;
    const tradeSignal = signal || normalizedAction;

    // 4. BUY Logic
    if (normalizedAction === 'BUY') {
      const hasBalance = await walletService.hasSufficientBalance(userId, totalValue);
      if (!hasBalance) {
        const error = new Error(`Insufficient wallet balance. Required: ₹${totalValue}`);
        error.code = 'INSUFFICIENT_BALANCE';
        throw error;
      }

      // Deduct from wallet
      const updatedWalletBalance = await walletService.deduct(userId, totalValue);

      // Add/update holding in portfolio
      const updatedHolding = await portfolioService.updateHoldingOnBuy(userId, cleanSymbol, numQuantity, numPrice);

      // Create Trade History Record
      const tradeRecord = await tradeHistoryService.createTradeRecord({
        userId,
        symbol: cleanSymbol,
        action: 'BUY',
        quantity: numQuantity,
        price: numPrice,
        totalValue,
        signal: tradeSignal,
        tradeType,
        profitLoss: 0
      });

      return {
        executed: true,
        action: 'BUY',
        tradeType,
        symbol: cleanSymbol,
        quantity: numQuantity,
        price: numPrice,
        totalValue,
        walletBalance: updatedWalletBalance,
        portfolioHolding: updatedHolding,
        trade: tradeRecord
      };
    }

    // 5. SELL Logic
    if (normalizedAction === 'SELL') {
      const existingHolding = await portfolioService.getHolding(userId, cleanSymbol);
      if (!existingHolding || existingHolding.quantity < numQuantity) {
        const ownedQty = existingHolding ? existingHolding.quantity : 0;
        const error = new Error(`Insufficient shares to sell. Owned: ${ownedQty}, Requested: ${numQuantity}`);
        error.code = 'INSUFFICIENT_HOLDINGS';
        throw error;
      }

      // Calculate realized P/L and update portfolio
      const { holding: updatedHolding, realizedPL } = await portfolioService.updateHoldingOnSell(
        userId,
        cleanSymbol,
        numQuantity,
        numPrice
      );

      // Add sale proceeds to wallet
      const updatedWalletBalance = await walletService.add(userId, totalValue);

      // Create Trade History Record
      const tradeRecord = await tradeHistoryService.createTradeRecord({
        userId,
        symbol: cleanSymbol,
        action: 'SELL',
        quantity: numQuantity,
        price: numPrice,
        totalValue,
        signal: tradeSignal,
        tradeType,
        profitLoss: realizedPL
      });

      return {
        executed: true,
        action: 'SELL',
        tradeType,
        symbol: cleanSymbol,
        quantity: numQuantity,
        price: numPrice,
        totalValue,
        realizedProfitLoss: realizedPL,
        walletBalance: updatedWalletBalance,
        portfolioHolding: updatedHolding,
        trade: tradeRecord
      };
    }
  }
}

module.exports = new TradingService();
