const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
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
  action: {
    type: String,
    required: true,
    enum: ['BUY', 'SELL', 'HOLD']
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true,
    min: 0
  },
  signal: {
    type: String,
    default: 'MANUAL'
  },
  tradeType: {
    type: String,
    enum: ['MANUAL', 'AUTOMATIC'],
    default: 'MANUAL'
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Trade || mongoose.model('Trade', tradeSchema);
