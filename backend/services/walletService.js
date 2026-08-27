const Wallet = require('../models/Wallet');
const { isDbConnected } = require('../config/db');

class WalletService {
  /**
   * Helper to get default initial balance from environment or fallback
   */
  _getInitialBalance() {
    return Number(process.env.INITIAL_WALLET_BALANCE) || 100000;
  }

  /**
   * Get current balance for a user
   */
  async getBalance(userId = 'default_user') {
    if (isDbConnected()) {
      let wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        // Automatically initialize wallet if it doesn't exist yet
        const initial = this._getInitialBalance();
        wallet = await Wallet.create({ userId, balance: initial });
      }
      return wallet.balance;
    }
    
    // In-memory fallback if DB is not connected (useful for standalone unit tests)
    return this._getInMemoryBalance(userId);
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId = 'default_user', amount = 0) {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct amount from user wallet
   */
  async deduct(userId = 'default_user', amount = 0) {
    if (amount <= 0) {
      throw new Error('Deduction amount must be greater than zero');
    }

    if (isDbConnected()) {
      // Auto-initialize wallet if it doesn't exist
      await this.getBalance(userId);

      // Perform atomic decrement while checking that balance remains >= amount
      const wallet = await Wallet.findOneAndUpdate(
        { userId, balance: { $gte: amount } },
        { $inc: { balance: -amount } },
        { new: true }
      );

      if (!wallet) {
        const err = new Error(`Insufficient wallet balance. Requested deduction: ₹${amount}`);
        err.code = 'INSUFFICIENT_BALANCE';
        throw err;
      }

      return wallet.balance;
    }

    // In-memory fallback
    const balance = this._getInMemoryBalance(userId);
    if (balance < amount) {
      const err = new Error(`Insufficient wallet balance. Requested deduction: ₹${amount}`);
      err.code = 'INSUFFICIENT_BALANCE';
      throw err;
    }
    const newBalance = balance - amount;
    this.inMemoryBalances.set(userId, newBalance);
    return newBalance;
  }

  /**
   * Add amount to user wallet
   */
  async add(userId = 'default_user', amount = 0) {
    if (amount <= 0) {
      throw new Error('Amount to add must be greater than zero');
    }

    if (isDbConnected()) {
      // Auto-initialize wallet if it doesn't exist
      await this.getBalance(userId);

      const wallet = await Wallet.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } },
        { new: true }
      );

      if (!wallet) {
        throw new Error('Wallet not found for user');
      }

      return wallet.balance;
    }

    // In-memory fallback
    const balance = this._getInMemoryBalance(userId);
    const newBalance = balance + amount;
    this.inMemoryBalances.set(userId, newBalance);
    return newBalance;
  }

  /**
   * Helper to reset wallet balance
   */
  async resetBalance(userId = 'default_user', initialAmount = 100000) {
    if (isDbConnected()) {
      const wallet = await Wallet.findOneAndUpdate(
        { userId },
        { balance: initialAmount },
        { new: true, upsert: true }
      );
      return wallet.balance;
    }

    // In-memory fallback
    this.inMemoryBalances.set(userId, initialAmount);
    return initialAmount;
  }

  // --- In-Memory Fallback Implementation for Testing/Decoupling ---
  constructor() {
    this.inMemoryBalances = new Map();
  }

  _getInMemoryBalance(userId) {
    if (!this.inMemoryBalances.has(userId)) {
      this.inMemoryBalances.set(userId, this._getInitialBalance());
    }
    return this.inMemoryBalances.get(userId);
  }
}

module.exports = new WalletService();
