const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: 'default_user'
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  averagePurchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  currentPrice: {
    type: Number,
    default: 0
  },
  investedAmount: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  profitLossPercentage: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Unique compound index for userId + symbol
portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);
