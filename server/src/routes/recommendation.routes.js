const express = require('express');
const router = express.Router();
const { 
    getRecommendations, 
    getRecommendationsAI // <-- Ensure this is imported
} = require('../controllers/recommendation.controller');
const { protect } = require('../middleware/auth.middleware');

// @route   GET /api/recommendations - Default skills-based match
router.get('/', protect, getRecommendations);

// @route   POST /api/recommendations/ai - AI prompt-based match
router.post('/ai', protect, getRecommendationsAI); // <-- THIS IS THE CRITICAL NEW ROUTE

module.exports = router;