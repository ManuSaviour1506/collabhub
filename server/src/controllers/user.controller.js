const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const imagekit = require('../config/imagekit'); 
const pdfParse = require('pdf-parse'); // <--- RENAMED VARIABLE
const { spawn } = require('child_process'); 
const path = require('path');

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

// @desc    Register a new user
// @route   POST /api/users
exports.registerUser = async (req, res) => {
  const { username, email, password, fullName } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      fullName,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get User Profile
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        avatar: user.avatar,
        skillsKnown: user.skillsKnown,
        skillsWanted: user.skillsWanted,
        xp: user.xp,
        level: user.level,
        credits: user.credits
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update User Profile (Bio, Skills, Avatar)
// @route   PUT /api/users/profile
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.bio = req.body.bio || user.bio;
      user.skillsKnown = req.body.skillsKnown || user.skillsKnown;
      user.skillsWanted = req.body.skillsWanted || user.skillsWanted;

      // --- Handle ImageKit Upload ---
      if (req.body.avatarBase64) {
        try {
          const uploadResponse = await imagekit.upload({
            file: req.body.avatarBase64, // Base64 string from frontend
            fileName: `avatar_${user._id}_${Date.now()}.jpg`,
            folder: "/avatars"
          });
          user.avatar = uploadResponse.url; // Save the URL
          user.avatarFileId = uploadResponse.fileId; // Save ID for future cleanup
        } catch (error) {
          console.error("ImageKit Upload Error:", error);
          return res.status(500).json({ message: "Image upload failed" });
        }
      }
      // -----------------------------

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        skillsKnown: updatedUser.skillsKnown,
        skillsWanted: updatedUser.skillsWanted,
        xp: updatedUser.xp,
        level: updatedUser.level,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. COMMUNITY & LEADERBOARD
// ==========================================

// @desc    Get Top 10 Users (by XP)
// @route   GET /api/users/top
exports.getTopUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ xp: -1 }) // Descending order (Highest XP first)
      .limit(10)
      .select('fullName username avatar xp level skillsKnown'); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Users (Explore Community)
// @route   GET /api/users/all
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users except the one making the request
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('fullName username avatar xp level skillsKnown bio')
      .sort({ createdAt: -1 }); // Newest users first
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Leaderboard (Full List)
// @route   GET /api/users/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ xp: -1 })
      .limit(50) // Limit to top 50 for the dedicated page
      .select('fullName username avatar xp level skillsKnown');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. AI FEATURES (Resume Parser - LOCAL ML)
// ==========================================

// @desc    Parse Resume PDF (Uses Python NLP)
// @route   POST /api/users/parse-resume
exports.parseResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    console.log("Processing resume..."); // DEBUG LOG
    
    // 1. Extract Text from PDF (Using the renamed variable)
    const pdfData = await pdfParse(req.file.buffer); 
    
    // Remove excessive whitespace/newlines
    const resumeText = pdfData.text.replace(/\s+/g, ' ').substring(0, 5000);
    console.log("Text extracted length:", resumeText.length); // DEBUG LOG

    // 2. Spawn Python Process
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const scriptPath = path.join(__dirname, '../../../ml_engine.py');
    
    console.log("Spawning Python:", pythonCommand, scriptPath); // DEBUG LOG

    const pythonProcess = spawn(pythonCommand, [ 
      scriptPath, 
      'parse_resume', 
      resumeText
    ]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Logic Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      try {
        if (code !== 0) throw new Error("Python script exited with error code: " + code);

        const parsedData = JSON.parse(dataString);
        if (parsedData.error) return res.status(500).json({ message: parsedData.error });

        res.json(parsedData);
      } catch (e) {
        console.error("Parsing Failed:", e);
        console.error("Python Output was:", dataString);
        res.status(500).json({ message: "Failed to process resume with AI" });
      }
    });

  } catch (error) {
    console.error("Resume Parse Error:", error);
    res.status(500).json({ message: "Failed to parse resume: " + error.message });
  }
};