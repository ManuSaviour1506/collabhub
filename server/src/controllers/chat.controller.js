const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Create or fetch One-on-One Chat
// @route   POST /api/chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body; // The ID of the user you want to chat with

  if (!userId) return res.status(400).send("UserId param not sent with request");

  // Check if chat exists
  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user.id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  }).populate("users", "-password").populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "username pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // Create new chat
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user.id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
      res.status(200).send(FullChat);
    } catch (error) {
      // FIX: Changed .throw to .send
      res.status(400).send(error.message);
    }
  }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chat
exports.fetchChats = async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user.id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "username pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
  }
};

// @desc    Send Message
// @route   POST /api/message
exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) return res.status(400).send("Invalid data");

  var newMessage = {
    sender: req.user.id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "username pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
        path: "chat.users",
        select: "username pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    res.json(message);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "username pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400).send(error.message);
  }
};