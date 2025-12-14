const User = require('../models/User');

// @desc    Update My Location
// @route   PUT /api/nearby/location
exports.updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const user = await User.findById(req.user.id);
    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude] // MongoDB expects [long, lat]
    };
    user.isLocationShared = true;
    await user.save();
    res.json({ message: "Location updated", coordinates: user.location.coordinates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Find Mentors Nearby
// @route   GET /api/nearby/search?skill=React&radius=10
exports.findNearbyMentors = async (req, res) => {
  const { skill, radius } = req.query; // radius in km
  const maxDistance = (radius || 10) * 1000; // convert km to meters

  try {
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser.location || !currentUser.location.coordinates.length) {
      return res.status(400).json({ message: "Please enable your location first." });
    }

    const query = {
      location: {
        $near: {
          $geometry: currentUser.location,
          $maxDistance: maxDistance
        }
      },
      _id: { $ne: req.user.id } // Exclude self
    };

    if (skill) {
      // Case-insensitive regex for skill matching
      query.skillsKnown = { $regex: skill, $options: 'i' };
    }

    const users = await User.find(query).select('username fullName skillsKnown location avatar');
    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};