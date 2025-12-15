const Session = require('../models/Session');
const Notification = require('../models/Notification'); 

// @desc    Request a Session & Notify User
// @route   POST /api/sessions
exports.requestSession = async (req, res) => {
  const { receiverId, topic, startTime, duration } = req.body;

  try {
    // 1. Create the Session in DB
    const session = await Session.create({
      sender: req.user.id,
      receiver: receiverId,
      topic,
      startTime,
      duration
    });

    // 2. Create Persistent Notification in DB
    const notif = await Notification.create({
      recipient: receiverId,
      sender: req.user.id,
      type: 'session_request',
      message: `${req.user.fullName} wants to book a session: ${topic}`,
      link: `/chat` // Redirect to chat when clicked
    });

    // 3. Emit Real-Time Socket Event
    // This allows the receiver to see a popup toast immediately
    const io = req.app.get('io');
    
    if (io) {
      io.in(receiverId).emit("notification received", {
        _id: notif._id,
        message: `📅 New Session Request: ${topic} from ${req.user.fullName}`,
        type: 'session_request',
        senderName: req.user.fullName
      });
      console.log(`Socket notification sent to ${receiverId}`);
    } else {
      console.error("Socket.io instance not found on req.app");
    }

    res.status(201).json(session);

  } catch (error) {
    console.error("Session Request Error:", error);
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
    .populate('sender', 'username fullName avatar')
    .populate('receiver', 'username fullName avatar')
    .sort({ startTime: 1 }); // Soonest first
    
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};