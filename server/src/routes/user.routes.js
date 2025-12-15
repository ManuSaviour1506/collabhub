const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import Multer for file uploads
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getTopUsers,
  getAllUsers,
  getLeaderboard,
  parseResume // Import the new controller function
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

// --- CONFIGURATION ---
// Configure Multer to store files in memory (RAM) temporarily
// This allows us to pass the file buffer directly to the PDF parser
const upload = multer({ storage: multer.memoryStorage() });

// --- PUBLIC ROUTES ---
router.post('/', registerUser);
router.post('/login', loginUser);

// --- PROTECTED ROUTES ---
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// --- FEATURE ROUTES ---
router.get('/top', protect, getTopUsers);             // Home Page Widget (Top 10)
router.get('/all', protect, getAllUsers);             // Recommendations/Explore Page
router.get('/leaderboard', protect, getLeaderboard);  // Dedicated Leaderboard Page

// --- AI ROUTE: Resume Parser ---
// 'resume' is the key name expected in the form-data request
router.post('/parse-resume', protect, upload.single('resume'), parseResume);

module.exports = router;