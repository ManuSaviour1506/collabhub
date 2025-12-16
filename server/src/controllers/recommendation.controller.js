const User = require('../models/User');
const axios = require('axios'); // <-- NECESSARY IMPORT
const ML_SERVICE_URL = "http://localhost:5008"; // <-- NECESSARY CONST

// ==========================================
// 1. SKILLS-BASED MATCHING (DEFAULT)
// ==========================================

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

// ==========================================
// 2. AI MATCHING (PROMPT-BASED)
// ==========================================

// @desc    Get AI-powered recommendations based on user prompt
// @route   POST /api/recommendations/ai
exports.getRecommendationsAI = async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    try {
        // 1. Call Python Flask ML service
        // Sends the prompt to the /ai-match endpoint
        const pythonRes = await axios.post(`${ML_SERVICE_URL}/ai-match`, {
            prompt: prompt // Key must be 'prompt' to match the Flask route logic
        });
        
        // Flask returns { matchedUserIds: [], category: "..." }
        const { matchedUserIds, category } = pythonRes.data;

        if (!matchedUserIds || matchedUserIds.length === 0) {
            // Return 200 with empty array if AI finds no matches
            return res.json([]); 
        }

        // 2. Fetch full user documents from MongoDB using the IDs returned by the AI
        const aiMatches = await User.find({ 
            _id: { $in: matchedUserIds }
        }).select('-password');
        
        // 3. Simple scoring/ranking (AI Match users get a base score of 100)
        const scoredMatches = aiMatches.map(user => ({
            ...user.toObject(),
            matchScore: 100, // Highest score for AI matches
            matchingReason: `AI Recommended (Category: ${category})`
        }));
        
        res.json(scoredMatches);

    } catch (error) {
        // Log detailed error from axios response if available
        console.error("AI Match Error:", error.response?.data?.error || error.message);
        
        // Return 500 error message based on the issue
        res.status(500).json({ 
            message: "AI Match failed. Check the Node.js server log for the detailed Python error or connection failure." 
        });
    }
};