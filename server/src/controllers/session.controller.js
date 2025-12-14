const Session = require('../models/Session');

// @desc    Request a Session
// @route   POST /api/sessions
exports.requestSession = async (req, res) => {
  const { receiverId, topic, startTime, duration } = req.body;

  try {
    const session = await Session.create({
      sender: req.user.id,
      receiver: receiverId,
      topic,
      startTime,
      duration
    });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get My Sessions
// @route   GET /api/sessions
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
    .populate('sender', 'username')
    .populate('receiver', 'username')
    .sort({ startTime: 1 }); // Soonest first
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};