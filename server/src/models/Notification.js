const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true }, // 'session_request', 'payment', 'system'
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  link: { type: String } // Optional: Link to redirect user (e.g., to the chat)
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);