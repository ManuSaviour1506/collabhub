const express = require('express');
const { sendMessage, allMessages } = require('../controllers/chat.controller'); // Reusing controller file for simplicity
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);

module.exports = router;