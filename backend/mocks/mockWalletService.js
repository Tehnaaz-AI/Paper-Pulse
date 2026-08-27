// MOCK - Replace with Laxman's wallet service
/**
 * Mock Wallet Service
 * Temporary in-memory virtual wallet repository to decouple from Laxman's wallet module.
 * Initial Balance per user: ₹100,000
 */

class MockWalletService {
  constructor() {
    // Map of userId -> balance (default user balance: ₹100,000)
    this.balances = new Map();
    this.DEFAULT_BALANCE = 100000;
  }

  _getOrCreateUserBalance(userId = 'default_user') {
    if (!this.balances.has(userId)) {
      this.balances.set(userId, this.DEFAULT_BALANCE);
    }
    return this.balances.get(userId);
  }

  /**
   * Get current balance for a user
   * @param {string} userId
   * @returns {number} balance
   */
  async getBalance(userId = 'default_user') {
    return this._getOrCreateUserBalance(userId);
  }

  /**
   * Check if user has at least `amount` balance
   * @param {string} userId
   * @param {number} amount
   * @returns {boolean}
   */
  async hasSufficientBalance(userId = 'default_user', amount = 0) {
    const current = await this.getBalance(userId);
    return current >= amount;
  }

  /**
   * Deduct amount from user wallet
   * @param {string} userId
   * @param {number} amount
   * @returns {number} updated balance
   */
  async deduct(userId = 'default_user', amount = 0) {
    if (amount <= 0) {
      throw new Error('Deduction amount must be greater than zero');
    }
    const current = await this.getBalance(userId);
    if (current < amount) {
      throw new Error('Insufficient wallet balance');
    }
    const newBalance = current - amount;
    this.balances.set(userId, newBalance);
    return newBalance;
  }

  /**
   * Add amount to user wallet
   * @param {string} userId
   * @param {number} amount
   * @returns {number} updated balance
   */
  async add(userId = 'default_user', amount = 0) {
    if (amount <= 0) {
      throw new Error('Amount to add must be greater than zero');
    }
    const current = await this.getBalance(userId);
    const newBalance = current + amount;
    this.balances.set(userId, newBalance);
    return newBalance;
  }

  /**
   * Helper method for testing: reset wallet balance
   */
  resetBalance(userId = 'default_user', initialAmount = 100000) {
    this.balances.set(userId, initialAmount);
    return initialAmount;
  }
}

module.exports = new MockWalletService();
