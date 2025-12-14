const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
  
  // Skills
  skillsKnown: [{ type: String }],
  skillsWanted: [{ type: String }],
  
  // Profile
  bio: { type: String },
  college: { type: String },
  
  // --- IMAGEKIT PROFILE PIC ---
  avatar: { type: String, default: "" },        // Stores the public URL (e.g., https://ik.imagekit.io/...)
  avatarFileId: { type: String, default: "" },  // Stores the internal ID (used to delete old images)

  // Gamification
  credits: { type: Number, default: 50 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  // Proximity & Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
  },
  isLocationShared: { type: Boolean, default: false }

}, { timestamps: true });

// Password middleware
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);