const express = require('express');
const router = express.Router();
const { requestSession, getMySessions, updateSessionStatus } = require('../controllers/session.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, requestSession);
router.get('/', protect, getMySessions);
// NEW ROUTE
router.put('/:id/status', protect, updateSessionStatus); 

module.exports = router;