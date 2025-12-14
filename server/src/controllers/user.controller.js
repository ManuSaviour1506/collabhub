const User = require('../models/User');
const imagekit = require('../config/imagekit'); // Import the config

// @desc    Get User Profile
// @route   GET /api/users/profile
exports.getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      bio: user.bio,
      avatar: user.avatar, // Ensure avatar is returned
      skillsKnown: user.skillsKnown,
      skillsWanted: user.skillsWanted,
      xp: user.xp,
      level: user.level,
      credits: user.credits
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update User Profile (Bio, Skills, Avatar)
// @route   PUT /api/users/profile
exports.updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.fullName = req.body.fullName || user.fullName;
    user.bio = req.body.bio || user.bio;
    user.skillsKnown = req.body.skillsKnown || user.skillsKnown;
    user.skillsWanted = req.body.skillsWanted || user.skillsWanted;

    // --- NEW: Handle Image Upload ---
    if (req.body.avatarBase64) {
      try {
        const uploadResponse = await imagekit.upload({
          file: req.body.avatarBase64, // Base64 string from frontend
          fileName: `avatar_${user._id}_${Date.now()}.jpg`,
          folder: "/avatars"
        });
        user.avatar = uploadResponse.url; // Save the ImageKit URL to DB
      } catch (error) {
        console.error("ImageKit Upload Error:", error);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }
    // --------------------------------

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      avatar: updatedUser.avatar, // Return new avatar URL
      bio: updatedUser.bio,
      skillsKnown: updatedUser.skillsKnown,
      skillsWanted: updatedUser.skillsWanted,
      token: req.headers.authorization.split(" ")[1] // Return token to keep session active
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};