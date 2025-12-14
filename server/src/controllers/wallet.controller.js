const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { addXP } = require('../services/gamification');

// @desc    Get My Wallet
// @route   GET /api/wallet
exports.getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    
    // Create wallet if it doesn't exist yet (for older users)
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id });
    }

    const transactions = await Transaction.find({ wallet: wallet._id }).sort({ createdAt: -1 });

    res.json({ wallet, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer Credits (Pay a Mentor)
// @route   POST /api/wallet/transfer
exports.transferCredits = async (req, res) => {
  const { receiverId, amount } = req.body;

  try {
    const senderWallet = await Wallet.findOne({ user: req.user.id });
    const receiverWallet = await Wallet.findOne({ user: receiverId });

    if (!receiverWallet) return res.status(404).json({ message: 'Receiver wallet not found' });
    if (senderWallet.balance < amount) return res.status(400).json({ message: 'Insufficient funds' });

    // 1. Deduct from Sender
    senderWallet.balance -= Number(amount);
    await senderWallet.save();

    await Transaction.create({
      wallet: senderWallet._id,
      type: 'DEBIT',
      amount: amount,
      description: 'Sent to peer',
      relatedUser: receiverId
    });

    // 2. Add to Receiver
    receiverWallet.balance += Number(amount);
    await receiverWallet.save();

    await Transaction.create({
      wallet: receiverWallet._id,
      type: 'CREDIT',
      amount: amount,
      description: 'Received from peer',
      relatedUser: req.user.id
    });

    // 3. Award XP (Gamification)
    // Sender gets 10 XP for being active
    await addXP(req.user.id, 10); 
    // Receiver (Mentor) gets 20 XP for helping
    await addXP(receiverId, 20);

    res.json({ success: true, newBalance: senderWallet.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};