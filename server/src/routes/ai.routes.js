const express = require('express');
const router = express.Router();
const { generateRoadmap, chatWithAI } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/roadmap', protect, generateRoadmap);
router.post('/chat', protect, chatWithAI);

module.exports = router;