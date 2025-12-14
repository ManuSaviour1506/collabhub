const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
  type: { type: String, enum: ['CREDIT', 'DEBIT', 'REWARD'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);