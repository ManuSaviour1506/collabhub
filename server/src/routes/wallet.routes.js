const express = require('express');
const router = express.Router();
const { getWallet, transferCredits } = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getWallet);
router.post('/transfer', protect, transferCredits);

module.exports = router;