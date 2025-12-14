const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, trim: true },
}, { timestamps: true });

// Prevent duplicate ratings (User A can't rate User B twice)
ratingSchema.index({ rater: 1, ratedUser: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);