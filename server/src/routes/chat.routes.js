const express = require('express');
const { accessChat, fetchChats } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.route('/').post(protect, accessChat).get(protect, fetchChats);

module.exports = router;