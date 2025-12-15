const express = require('express');
const router = express.Router();
const { generateRoadmap, chatWithAI, generateQuiz } = require('../controllers/ai.controller'); // Import generateQuiz
const { protect } = require('../middleware/auth.middleware');
const { semanticMatch } = require('../controllers/ai.controller');

router.post('/roadmap', protect, generateRoadmap);
router.post('/chat', protect, chatWithAI);
router.post('/quiz', protect, generateQuiz); // NEW ROUTE
router.post('/match', protect, semanticMatch);

module.exports = router;