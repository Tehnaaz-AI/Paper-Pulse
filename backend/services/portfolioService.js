const Portfolio = require('../models/Portfolio');
const csvStockService = require('./csvStockService');
const { isDbConnected } = require('../config/db');

class PortfolioService {
  /**
   * Enrich holding with latest close price from CSV dataset
   */
  _enrichHoldingWithCSVPrice(holding) {
    if (!holding) return null;
    
    // Cast Mongoose document to plain JS object if necessary
    const holdingObj = holding.toObject ? holding.toObject() : holding;
    
    const latestPrice = csvStockService.getLatestPrice(holdingObj.symbol);
    const investedAmount = holdingObj.quantity * holdingObj.averagePurchasePrice;
    const currentValue = holdingObj.quantity * latestPrice;
    const profitLoss = currentValue - investedAmount;
    const profitLossPercentage = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

    return {
      ...holdingObj,
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
    const cleanSymbol = symbol.trim().toUpperCase();

    if (isDbConnected()) {
      const holding = await Portfolio.findOne({ userId, symbol: cleanSymbol });
      return holding ? this._enrichHoldingWithCSVPrice(holding) : null;
    }

    // In-memory fallback
    const key = `${userId}:${cleanSymbol}`;
    const holding = this.inMemoryHoldings.get(key);
    return holding ? this._enrichHoldingWithCSVPrice(holding) : null;
  }

  /**
   * Get all holdings for a user
   */
  async getPortfolio(userId = 'default_user') {
    let finalHoldings = [];
    if (isDbConnected()) {
      const holdings = await Portfolio.find({ userId });
      finalHoldings = holdings.map((holding) => this._enrichHoldingWithCSVPrice(holding));
    } else {
      // In-memory fallback
      for (const [key, holding] of this.inMemoryHoldings.entries()) {
        if (key.startsWith(`${userId}:`)) {
          finalHoldings.push(this._enrichHoldingWithCSVPrice(holding));
        }
      }
    }

    let totalValue = 0;
    let totalInvested = 0;
    
    finalHoldings.forEach(h => {
      totalValue += (h.currentValue || 0);
      totalInvested += (h.investedAmount || 0);
    });

    return {
      holdings: finalHoldings,
      totalValue: Math.round(totalValue * 100) / 100,
      totalReturn: Math.round((totalValue - totalInvested) * 100) / 100
    };
  }

  /**
   * Update portfolio after a BUY transaction
   */
  async updateHoldingOnBuy(userId = 'default_user', symbol = '', quantity = 0, price = 0) {
    const cleanSymbol = symbol.trim().toUpperCase();

    if (isDbConnected()) {
      let holding = await Portfolio.findOne({ userId, symbol: cleanSymbol });
      
      let updatedQuantity = quantity;
      let updatedAvgPrice = price;

      if (holding) {
        const oldTotalCost = holding.quantity * holding.averagePurchasePrice;
        const newBuyCost = quantity * price;
        updatedQuantity = holding.quantity + quantity;
        updatedAvgPrice = (oldTotalCost + newBuyCost) / updatedQuantity;
        
        holding.quantity = updatedQuantity;
        holding.averagePurchasePrice = Math.round(updatedAvgPrice * 100) / 100;
        holding.updatedAt = new Date();
        await holding.save();
      } else {
        holding = await Portfolio.create({
          userId,
          symbol: cleanSymbol,
          quantity: updatedQuantity,
          averagePurchasePrice: Math.round(updatedAvgPrice * 100) / 100,
          updatedAt: new Date()
        });
      }

      return this._enrichHoldingWithCSVPrice(holding);
    }

    // In-memory fallback
    const key = `${userId}:${cleanSymbol}`;
    const existing = this.inMemoryHoldings.get(key);
    
    let updatedQuantity = quantity;
    let updatedAvgPrice = price;

    if (existing) {
      const oldTotalCost = existing.quantity * existing.averagePurchasePrice;
      const newBuyCost = quantity * price;
      updatedQuantity = existing.quantity + quantity;
      updatedAvgPrice = (oldTotalCost + newBuyCost) / updatedQuantity;
    }

    const updatedHolding = {
      userId,
      symbol: cleanSymbol,
      quantity: updatedQuantity,
      averagePurchasePrice: Math.round(updatedAvgPrice * 100) / 100,
      updatedAt: new Date().toISOString()
    };

    this.inMemoryHoldings.set(key, updatedHolding);
    return this._enrichHoldingWithCSVPrice(updatedHolding);
  }

  /**
   * Update portfolio after a SELL transaction
   */
  async updateHoldingOnSell(userId = 'default_user', symbol = '', quantity = 0, sellPrice = 0) {
    const cleanSymbol = symbol.trim().toUpperCase();

    if (isDbConnected()) {
      const holding = await Portfolio.findOne({ userId, symbol: cleanSymbol });
      if (!holding || holding.quantity < quantity) {
        throw new Error(`Insufficient shares owned for ${cleanSymbol}. Owned: ${holding ? holding.quantity : 0}, Requested: ${quantity}`);
      }

      const avgPrice = holding.averagePurchasePrice;
      const realizedPL = (sellPrice - avgPrice) * quantity;
      const remainingQuantity = holding.quantity - quantity;

      let updatedHolding = null;

      if (remainingQuantity === 0) {
        await Portfolio.deleteOne({ _id: holding._id });
      } else {
        holding.quantity = remainingQuantity;
        holding.updatedAt = new Date();
        await holding.save();
        updatedHolding = this._enrichHoldingWithCSVPrice(holding);
      }

      return {
        holding: updatedHolding,
        realizedPL: Math.round(realizedPL * 100) / 100
      };
    }

    // In-memory fallback
    const key = `${userId}:${cleanSymbol}`;
    const existing = this.inMemoryHoldings.get(key);
    if (!existing || existing.quantity < quantity) {
      throw new Error(`Insufficient shares owned for ${cleanSymbol}. Owned: ${existing ? existing.quantity : 0}, Requested: ${quantity}`);
    }

    const avgPrice = existing.averagePurchasePrice;
    const realizedPL = (sellPrice - avgPrice) * quantity;
    const remainingQuantity = existing.quantity - quantity;

    let updatedHolding = null;

    if (remainingQuantity === 0) {
      this.inMemoryHoldings.delete(key);
    } else {
      const nextHolding = {
        userId,
        symbol: cleanSymbol,
        quantity: remainingQuantity,
        averagePurchasePrice: avgPrice,
        updatedAt: new Date().toISOString()
      };
      this.inMemoryHoldings.set(key, nextHolding);
      updatedHolding = this._enrichHoldingWithCSVPrice(nextHolding);
    }

    return {
      holding: updatedHolding,
      realizedPL: Math.round(realizedPL * 100) / 100
    };
  }

  /**
   * Reset holdings for test suite
   */
  async resetHoldings() {
    if (isDbConnected()) {
      await Portfolio.deleteMany({});
    }
    this.inMemoryHoldings.clear();
  }

  // --- In-Memory Fallback Implementation for Testing/Decoupling ---
  constructor() {
    this.inMemoryHoldings = new Map();
  }
}

module.exports = new PortfolioService();
