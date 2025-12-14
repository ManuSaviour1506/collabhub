const User = require('../models/User');

// @desc    Get user recommendations based on skills
// @route   GET /api/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // 1. Find users who know the skills the current user wants
    // 2. Exclude the current user
    const potentialMatches = await User.find({
      _id: { $ne: currentUser._id }, // Not self
      skillsKnown: { $in: currentUser.skillsWanted } // Overlap logic
    }).select('-password');

    // 3. Calculate Match Score (Simple Algorithm)
    const scoredMatches = potentialMatches.map(user => {
      let score = 0;
      
      // Calculate 'Teach Score': How many skills can they teach me?
      const teachMatch = user.skillsKnown.filter(skill => 
        currentUser.skillsWanted.includes(skill)
      );
      score += (teachMatch.length * 10); 

      // Calculate 'Learn Score' (Mutual): Can I teach them something back?
      const learnMatch = user.skillsWanted.filter(skill => 
        currentUser.skillsKnown.includes(skill)
      );
      score += (learnMatch.length * 5); // Mutual benefit bonus

      return {
        ...user.toObject(),
        matchScore: score,
        matchingSkills: teachMatch
      };
    });

    // 4. Sort by highest score
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scoredMatches);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};