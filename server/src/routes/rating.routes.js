const express = require('express');
const router = express.Router();
const { addRating, getUserRatings } = require('../controllers/rating.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, addRating);
router.get('/:userId', getUserRatings);

module.exports = router;