import { useEffect } from 'react'; // Import useEffect
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast'; // Import toast
import { AuthProvider } from './context/AuthContext';
import io from 'socket.io-client'; // Import socket

// Import Pages (Keep existing imports)
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import Chat from './pages/Chat';
import Wallet from './pages/Wallet';
import LearnSkill from './pages/LearnSkill';
import Leaderboard from './pages/Leaderboard';

import Nearby from './pages/Nearby';
import Classroom from './pages/Classroom';
import Search from './pages/Search';
import ProjectBoard from './pages/ProjectBoard';

// Determine Socket URL
const ENDPOINT = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : "http://localhost:5001";

// Private Route Wrapper (Keep as is)
const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? children : <Navigate to="/login" />;
};

// --- NEW COMPONENT: Global Socket Listener ---
const SocketListener = () => {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const socket = io(ENDPOINT);
    socket.emit("setup", user);

    // Listener 1: New Message
    socket.on("message received", (newMessage) => {
      // Only notify if we are NOT on the chat page (optional logic)
      toast(`New message from ${newMessage.sender.fullName}`, {
        icon: '💬',
        duration: 4000,
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
    });

    // Listener 2: Generic Notifications (Session requests, Wallet tips)
    // You need to emit this event from backend when these actions happen
    socket.on("notification received", (notif) => {
      toast(notif.message || "New Notification", {
        icon: '🔔',
        duration: 5000
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything visually
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Activate the Listener */}
      <SocketListener /> 

      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
          <Route path="/learn" element={<PrivateRoute><LearnSkill /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          
          {/* Feature Routes */}
          <Route path="/project/:id" element={<PrivateRoute><ProjectBoard /></PrivateRoute>} />
          <Route path="/nearby" element={<PrivateRoute><Nearby /></PrivateRoute>} />
          <Route path="/classroom/:roomId" element={<PrivateRoute><Classroom /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/project/:id" element={<PrivateRoute><ProjectBoard /></PrivateRoute>} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;