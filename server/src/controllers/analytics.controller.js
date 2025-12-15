const Session = require('../models/Session');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get User Analytics (Last 7 Days)
// @route   GET /api/analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Calculate date 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Aggregate Sessions per Day (Last 7 Days)
    const sessions = await Session.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }], // User is sender OR receiver
          startTime: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Format Data for the Chart (Fill in missing days with 0)
    const analyticsData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      const sessionFound = sessions.find(s => s._id === dateString);
      const sessionCount = sessionFound ? sessionFound.count : 0;

      analyticsData.push({
        name: dayName,
        date: dateString,
        sessions: sessionCount,
        xp: 0 // Placeholder, we calculate this next
      });
    }

    // 3. Project XP Growth Backward
    // Since we store current XP, we can simulate the history graph
    // Assumption: 1 Session = ~50 XP gained
    const currentUser = await User.findById(userId);
    let currentTotalXP = currentUser.xp || 0;

    // Loop backwards to calculate historical XP snapshot
    for (let i = analyticsData.length - 1; i >= 0; i--) {
        analyticsData[i].xp = currentTotalXP;
        // Estimate previous day's XP by subtracting today's gain
        const dailyGain = (analyticsData[i].sessions * 50); 
        currentTotalXP = Math.max(0, currentTotalXP - dailyGain);
    }

    res.json(analyticsData);

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};