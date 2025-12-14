const User = require('../models/User');

exports.addXP = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    user.xp = (user.xp || 0) + amount;

    // Simple Level Up Logic (Level up every 100 XP)
    const newLevel = Math.floor(user.xp / 100) + 1;
    
    if (newLevel > user.level) {
      user.level = newLevel;
      // You could emit a socket event here for "Level Up!" notification
      console.log(`User ${user.username} leveled up to ${newLevel}!`);
    }

    await user.save();
    return user.level;
  } catch (error) {
    console.error("XP Error:", error);
  }
};

exports.checkBadges = async (userId) => {
  // Future logic: Check stats and award badges
  return true;
};