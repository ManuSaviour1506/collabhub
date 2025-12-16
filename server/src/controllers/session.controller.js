const Session = require('../models/Session');
const Notification = require('../models/Notification'); 
const { addXP } = require('../services/gamification'); // For rewarding XP
const User = require('../models/User'); // To fetch user details for notifications

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
      link: `/chat` 
    });

    // 3. Emit Real-Time Socket Event
    const io = req.app.get('io');
    
    if (io) {
      io.in(receiverId).emit("notification received", {
        _id: notif._id,
        message: `📅 New Session Request: ${topic} from ${req.user.fullName}`,
        type: 'session_request',
        senderName: req.user.fullName
      });
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


// @desc    Update Session Status (Accept, Cancel, Complete)
// @route   PUT /api/sessions/:id/status
exports.updateSessionStatus = async (req, res) => {
    const { newStatus } = req.body;
    const sessionId = req.params.id;
    const currentUserId = req.user.id; // User making the status change

    try {
        const session = await Session.findById(sessionId)
            .populate('sender', 'fullName')
            .populate('receiver', 'fullName');

        if (!session) return res.status(404).json({ message: "Session not found" });

        // Ensure only sender/receiver can modify the session
        const isParticipant = session.sender._id.equals(currentUserId) || session.receiver._id.equals(currentUserId);
        if (!isParticipant) {
            return res.status(403).json({ message: "Not authorized to modify this session" });
        }

        const io = req.app.get('io');
        let notificationMessage = '';
        const otherUserId = session.sender._id.equals(currentUserId) ? session.receiver._id : session.sender._id;

        // --- CORE STATUS LOGIC ---

        if (newStatus === 'accepted' && session.status === 'pending') {
            session.status = 'accepted';
            notificationMessage = `${req.user.fullName} accepted your session request: ${session.topic}`;
            await addXP(currentUserId, 10); // Mentor gets small XP for accepting
        
        } else if (newStatus === 'cancelled') {
            session.status = 'cancelled';
            notificationMessage = `${req.user.fullName} cancelled the session: ${session.topic}`;
        
        } else if (newStatus === 'completed' && session.status === 'accepted') {
            session.status = 'completed';
            
            // 1. XP REWARD: Mentor (receiver) gets more XP than student (sender)
            await addXP(session.receiver._id, 50); // Mentor reward
            await addXP(session.sender._id, 10); // Student reward (for being active)
            
            // 2. NOTIFICATION & MESSAGE
            notificationMessage = `Session completed! You earned XP for teaching ${session.topic}.`;

            // NOTE: In a real app, wallet transfers (like refunding escrow or final payment) 
            // would also be triggered here.
        } else {
             return res.status(400).json({ message: "Invalid status transition." });
        }

        // Save new status
        const updatedSession = await session.save();

        // Send notification to the other participant
        if (io && notificationMessage) {
             const newNotif = await Notification.create({
                recipient: otherUserId,
                sender: currentUserId,
                type: 'session_update',
                message: notificationMessage,
                link: `/sessions` 
            });
            io.in(otherUserId.toString()).emit("notification received", {
                _id: newNotif._id,
                message: notificationMessage,
                type: 'session_update',
            });
        }


        res.json(updatedSession);
    } catch (error) {
        console.error("Session Update Error:", error);
        res.status(500).json({ message: error.message });
    }
};