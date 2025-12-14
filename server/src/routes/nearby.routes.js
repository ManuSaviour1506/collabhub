const express = require('express');
const router = express.Router();
const { updateLocation, findNearbyMentors } = require('../controllers/nearby.controller');
const { protect } = require('../middleware/auth.middleware');

router.put('/location', protect, updateLocation);
router.get('/search', protect, findNearbyMentors);

module.exports = router;