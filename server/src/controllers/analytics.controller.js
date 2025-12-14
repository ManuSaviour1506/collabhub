const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });

    // Calculate XP Progress (Level 1 = 0-100xp, Level 2 = 101-200xp)
    const currentLevelBase = (user.level - 1) * 100;
    const xpProgress = ((user.xp - currentLevelBase) / 100) * 100;

    // Get Weekly Activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const transactions = await Transaction.find({
      wallet: wallet._id,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Format for Chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityMap = {};
    
    // Initialize empty days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      activityMap[dayName] = { name: dayName, earned: 0, spent: 0 };
    }

    transactions.forEach(tx => {
      const dayName = days[new Date(tx.createdAt).getDay()];
      if (activityMap[dayName]) {
        if (tx.type === 'CREDIT') activityMap[dayName].earned += tx.amount;
        if (tx.type === 'DEBIT') activityMap[dayName].spent += tx.amount;
      }
    });

    res.json({
      xp: user.xp,
      level: user.level,
      xpProgress, 
      walletBalance: wallet.balance,
      activityData: Object.values(activityMap)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};