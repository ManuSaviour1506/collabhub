const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { Server } = require("socket.io"); // Import Socket.IO
const http = require('http'); // Import HTTP
const path = require('path');

// Load env vars (Explicit path to ensure it finds .env)
dotenv.config({ path: path.resolve(__dirname, './.env') });

// Connect to Database
connectDB();

const app = express();

// --- 1. SETUP SERVER & SOCKET.IO EARLY ---
// We create the server first so we can attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CLIENT_URL, // e.g. "http://localhost:5173"
    credentials: true,
  },
});

// --- 2. MAKE SOCKET.IO ACCESSIBLE TO CONTROLLERS ---
// This allows files like wallet.controller.js to use req.app.get('io') to send alerts
app.set('io', io);

// --- 3. MIDDLEWARE ---
// Increase limit to 50mb to handle ImageKit base64 uploads
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// --- 4. ROUTES ---
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/users', require('./src/routes/user.routes'));
app.use('/api/recommendations', require('./src/routes/recommendation.routes'));
app.use('/api/chat', require('./src/routes/chat.routes'));
app.use('/api/message', require('./src/routes/message.routes'));
app.use('/api/wallet', require('./src/routes/wallet.routes'));
app.use('/api/ratings', require('./src/routes/rating.routes'));
app.use('/api/projects', require('./src/routes/project.routes'));
app.use('/api/ai', require('./src/routes/ai.routes'));
app.use('/api/notifications', require('./src/routes/notification.routes'));
app.use('/api/analytics', require('./src/routes/analytics.routes'));
app.use('/api/nearby', require('./src/routes/nearby.routes'));
app.use('/api/sessions', require('./src/routes/session.routes'));

// Root Route
app.get('/', (req, res) => {
  res.send('CollabHub API is running...');
});

// --- 5. SOCKET.IO EVENT LOGIC ---
io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // User joins their own personal room (for notifications/private messages)
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  // User joins a specific chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  // Sending a message
  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageReceived.sender._id) return; // Don't send back to sender
      
      // Emit to the specific user's room
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Handle Notifications (Optional direct event listener)
  socket.on("notification received", (notif) => {
     // Logic is mostly handled in controller, but this listener keeps socket active
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    // socket.leave(userData._id); // userData is not in scope here, handled by disconnect
  });
});
// -----------------------

const PORT = process.env.PORT || 5001;

// IMPORTANT: server.listen (not app.listen) for Socket.IO to work
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});