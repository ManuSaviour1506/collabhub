const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  balance: { type: Number, default: 50 }, // Start with 50 free credits
  escrow: { type: Number, default: 0 },   // Credits locked during a project
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);