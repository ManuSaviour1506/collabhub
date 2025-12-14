const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true }, // e.g., "Early Adopter", "Top Mentor"
  icon: { type: String }, // Emoji or URL
  description: { type: String },
  awardedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', badgeSchema);