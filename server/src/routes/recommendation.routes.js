const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendation.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getRecommendations);

module.exports = router;