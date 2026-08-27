// MOCK - Replace with Laxman's portfolio service
/**
 * Mock Portfolio Service
 * In-memory portfolio repository managing stock holdings, average purchase price recalculations,
 * and realized P/L calculations. Integrates real CSV stock prices for live market valuation.
 */

const csvStockService = require('../services/csvStockService');

class MockPortfolioService {
  constructor() {
    // Map of key `${userId}:${symbol}` -> holding object
    this.holdings = new Map();
  }

  _getKey(userId = 'default_user', symbol = '') {
    return `${userId}:${symbol.toUpperCase()}`;
  }

  /**
   * Enrich holding with latest close price from CSV dataset
   */
  _enrichHoldingWithCSVPrice(holding) {
    if (!holding) return null;
    const latestPrice = csvStockService.getLatestPrice(holding.symbol);
    const investedAmount = holding.quantity * holding.averagePurchasePrice;
    const currentValue = holding.quantity * latestPrice;
    const profitLoss = currentValue - investedAmount;
    const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

    return {
      ...holding,
      currentPrice: latestPrice,
      investedAmount: Math.round(investedAmount * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercentage: Math.round(profitLossPercentage * 100) / 100
    };
  }

  /**
   * Get holding for a given symbol
   */
  async getHolding(userId = 'default_user', symbol = '') {
    const key = this._getKey(userId, symbol);
    const holding = this.holdings.get(key);
    return holding ? this._enrichHoldingWithCSVPrice(holding) : null;
  }

  /**
   * Get all holdings for a user
   */
  async getPortfolio(userId = 'default_user') {
    const userHoldings = [];
    for (const [key, holding] of this.holdings.entries()) {
      if (key.startsWith(`${userId}:`)) {
        userHoldings.push(this._enrichHoldingWithCSVPrice(holding));
      }
    }
    return userHoldings;
  }

  /**
   * Update portfolio after a BUY transaction
   * Recalculates average purchase price and invested amount
   */
  async updateHoldingOnBuy(userId = 'default_user', symbol = '', quantity = 0, price = 0) {
    const key = this._getKey(userId, symbol);
    const existing = this.holdings.get(key);

    let updatedQuantity = quantity;
    let updatedAvgPrice = price;

    if (existing) {
      const oldTotalCost = existing.quantity * existing.averagePurchasePrice;
      const newBuyCost = quantity * price;
      updatedQuantity = existing.quantity + quantity;
      updatedAvgPrice = (oldTotalCost + newBuyCost) / updatedQuantity;
    }

    const investedAmount = updatedQuantity * updatedAvgPrice;
    const currentValue = updatedQuantity * price;
    const profitLoss = currentValue - investedAmount;
    const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

    const updatedHolding = {
      userId,
      symbol: symbol.toUpperCase(),
      quantity: updatedQuantity,
      averagePurchasePrice: Math.round(updatedAvgPrice * 100) / 100,
      currentPrice: price,
      investedAmount: Math.round(investedAmount * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercentage: Math.round(profitLossPercentage * 100) / 100,
      updatedAt: new Date().toISOString()
    };

    this.holdings.set(key, updatedHolding);
    return this._enrichHoldingWithCSVPrice(updatedHolding);
  }

  /**
   * Update portfolio after a SELL transaction
   * Reduces quantity, removes holding if quantity reaches 0, and calculates realized P/L
   */
  async updateHoldingOnSell(userId = 'default_user', symbol = '', quantity = 0, sellPrice = 0) {
    const key = this._getKey(userId, symbol);
    const existing = this.holdings.get(key);

    if (!existing || existing.quantity < quantity) {
      throw new Error(`Insufficient shares owned for ${symbol}. Owned: ${existing ? existing.quantity : 0}, Requested: ${quantity}`);
    }

    const avgPrice = existing.averagePurchasePrice;
    const realizedPL = (sellPrice - avgPrice) * quantity;
    const remainingQuantity = existing.quantity - quantity;

    let updatedHolding = null;

    if (remainingQuantity === 0) {
      this.holdings.delete(key);
    } else {
      const investedAmount = remainingQuantity * avgPrice;
      const currentValue = remainingQuantity * sellPrice;
      const profitLoss = currentValue - investedAmount;
      const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

      updatedHolding = {
        userId,
        symbol: symbol.toUpperCase(),
        quantity: remainingQuantity,
        averagePurchasePrice: avgPrice,
        currentPrice: sellPrice,
        investedAmount: Math.round(investedAmount * 100) / 100,
        currentValue: Math.round(currentValue * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercentage: Math.round(profitLossPercentage * 100) / 100,
        updatedAt: new Date().toISOString()
      };

      this.holdings.set(key, updatedHolding);
      updatedHolding = this._enrichHoldingWithCSVPrice(updatedHolding);
    }

    return {
      holding: updatedHolding,
      realizedPL: Math.round(realizedPL * 100) / 100
    };
  }

  /**
   * Reset holdings for test suite
   */
  resetHoldings() {
    this.holdings.clear();
  }
}

module.exports = new MockPortfolioService();
