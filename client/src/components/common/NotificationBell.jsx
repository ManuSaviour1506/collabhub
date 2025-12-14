import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import AuthContext from '../../context/AuthContext';
import api from '../../services/api';

const ENDPOINT = "http://localhost:5001"; 

const NotificationBell = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Load initial notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Setup Socket for Real-Time alerts
    const socket = io(ENDPOINT);
    socket.emit("setup", user);

    socket.on("notification received", (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) { console.error(error); }
  };

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        await api.put('/notifications/read', {}, { headers: { Authorization: `Bearer ${token}` } });
        setUnreadCount(0);
      } catch (error) { console.error(error); }
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button onClick={handleOpen} className="relative p-2 text-gray-600 hover:text-indigo-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-100">
          <div className="p-3 border-b bg-gray-50 font-bold text-gray-700">Notifications</div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No notifications yet.</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif._id} className={`p-3 border-b hover:bg-gray-50 text-sm ${!notif.read ? 'bg-blue-50' : ''}`}>
                  <p className="text-gray-800">{notif.message}</p>
                  <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
          <div className="p-2 bg-gray-50 text-center">
            <button onClick={() => { setIsOpen(false); navigate('/wallet'); }} className="text-xs text-indigo-600 hover:underline">
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;