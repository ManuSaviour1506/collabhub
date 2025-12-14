const Rating = require('../models/Rating');
const User = require('../models/User');
const { addXP } = require('../services/gamification');

// @desc    Rate a peer
// @route   POST /api/ratings
exports.addRating = async (req, res) => {
  const { ratedUserId, rating, review } = req.body;

  try {
    if (req.user.id === ratedUserId) {
      return res.status(400).json({ message: "You cannot rate yourself" });
    }

    // Create the rating
    const newRating = await Rating.create({
      rater: req.user.id,
      ratedUser: ratedUserId,
      rating,
      review
    });

    // Award XP to the person who was rated (if rating is good)
    if (rating >= 4) {
      await addXP(ratedUserId, 50); // Big boost for good reviews!
    }

    // Award small XP to the rater for participating
    await addXP(req.user.id, 5);

    res.status(201).json(newRating);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "You have already rated this user" });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

// @desc    Get ratings for a user
// @route   GET /api/ratings/:userId
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedUser: req.params.userId })
      .populate('rater', 'username fullName avatar');
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};