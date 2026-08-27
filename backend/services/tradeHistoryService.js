const Trade = require('../models/Trade');
const { isDbConnected } = require('../config/db');

class TradeHistoryService {
  constructor() {
    // In-memory trade history backup for offline/mock testing
    this.inMemoryTrades = [];
  }

  /**
   * Save a completed trade record
   */
  async createTradeRecord(tradeData) {
    const record = {
      userId: tradeData.userId || 'default_user',
      symbol: tradeData.symbol.toUpperCase(),
      action: tradeData.action.toUpperCase(),
      quantity: Number(tradeData.quantity),
      price: Number(tradeData.price),
      totalValue: Number(tradeData.totalValue),
      signal: tradeData.signal || tradeData.action || 'BUY',
      tradeType: tradeData.tradeType || 'MANUAL',
      profitLoss: Number(tradeData.profitLoss || 0),
      timestamp: tradeData.timestamp ? new Date(tradeData.timestamp) : new Date()
    };

    if (isDbConnected()) {
      try {
        const mongoTrade = await Trade.create(record);
        return mongoTrade.toObject();
      } catch (err) {
        console.warn(`[TradeHistoryService] MongoDB write error (${err.message}). Saving to in-memory store.`);
      }
    }

    // In-memory fallback
    const mockRecord = {
      _id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      ...record
    };
    this.inMemoryTrades.unshift(mockRecord);
    return mockRecord;
  }

  /**
   * Retrieve trade history for a user, optionally filtered by stock symbol
   */
  async getTradeHistory(userId = 'default_user', symbol = null) {
    if (isDbConnected()) {
      try {
        const query = { userId };
        if (symbol) {
          query.symbol = symbol.toUpperCase();
        }
        return await Trade.find(query).sort({ timestamp: -1 }).lean();
      } catch (err) {
        console.warn(`[TradeHistoryService] MongoDB read error (${err.message}). Querying in-memory store.`);
      }
    }

    // In-memory query
    return this.inMemoryTrades.filter((t) => {
      const matchUser = t.userId === userId;
      const matchSymbol = symbol ? t.symbol === symbol.toUpperCase() : true;
      return matchUser && matchSymbol;
    });
  }

  /**
   * Helper for testing
   */
  clearHistory() {
    this.inMemoryTrades = [];
  }
}

module.exports = new TradeHistoryService();
