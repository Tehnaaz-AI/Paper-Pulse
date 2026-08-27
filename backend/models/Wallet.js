const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true,
    index: true
  },
  balance: {
    type: Number,
    required: [true, 'Balance is required'],
    min: [0, 'Wallet balance cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Wallet || mongoose.model('Wallet', walletSchema);
