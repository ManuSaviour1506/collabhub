const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who requested it
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who received the request
  topic: { type: String, required: true },
  startTime: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // in minutes
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);