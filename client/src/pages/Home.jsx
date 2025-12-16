import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import AuthContext from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';
import Analytics from '../components/dashboard/Analytics';
import api from '../services/api';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const [topUsers, setTopUsers] = useState([]);
  const navigate = useNavigate();

  // Fetch Top Users on Mount
  useEffect(() => {
    const fetchTopUsers = async () => {
      if (!user) return;
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.get('/users/top', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTopUsers(data);
      } catch (error) {
        console.error("Failed to fetch top users", error);
      }
    };
    fetchTopUsers();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 relative">
      
      {/* --- HEADER --- */}
      {user && (
        <div className="absolute top-5 right-5 flex items-center gap-4 z-20">
          <div className="text-right hidden md:block">
            <span className="block font-bold text-gray-700">{user.username}</span>
            <span className="text-xs text-gray-500">Level {user.level || 1}</span>
          </div>
          
          <NotificationBell />
          
          {/* Header Logout Button */}
          <button 
            onClick={handleLogout}
            className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg text-sm font-bold shadow-sm transition"
          >
            Logout
          </button>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col items-center mt-20 md:mt-10">
        <h1 className="text-5xl font-bold text-indigo-600 mb-2">CollabHub</h1>
        <p className="text-xl text-gray-600 mb-8">The AI-powered platform to learn, teach, and build credibility.</p>

        {user ? (
          <>
            {/* --- QUICK ACTIONS --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg w-full mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <Link to="/profile" className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"><span className="font-bold">Profile</span></Link>
                 <Link to="/recommendations" className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"><span className="font-bold">Mentors</span></Link>
                 <Link to="/chat" className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"><span className="font-bold">Chat</span></Link>
                 <Link to="/nearby" className="flex flex-col items-center justify-center p-4 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition"><span className="font-bold">📍 Nearby</span></Link>
                 <Link to="/classroom/demo-123" className="flex flex-col items-center justify-center p-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"><span className="font-bold">🎨 Whiteboard</span></Link>
                 <Link to="/sessions" className="flex flex-col items-center justify-center p-4 bg-fuchsia-50 text-fuchsia-700 rounded-lg hover:bg-fuchsia-100 transition"><span className="font-bold">📅 Sessions</span></Link> {/* <-- SESSIONS LINK ADDED */}
                 <Link to="/search" className="flex flex-col items-center justify-center p-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"><span className="font-bold">🔍 Search</span></Link>
                 <Link to="/wallet" className="flex flex-col items-center justify-center p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition"><span className="font-bold">Wallet</span></Link>
                 <Link to="/learn" className="flex flex-col items-center justify-center p-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition"><span className="font-bold">AI Tutor</span></Link>
                 
                 {/* Large Logout Button (Mobile Friendly) */}
                 <button onClick={handleLogout} className="flex flex-col items-center justify-center p-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition col-span-2 md:col-span-4 mt-2 border border-red-100">
                    <span className="font-bold">Log Out</span>
                 </button>
              </div>
            </div>

            {/* --- TOP 10 USERS SECTION --- */}
            <div className="w-full mb-8">
              <div className="flex justify-between items-center mb-4 ml-2">
                <h2 className="text-2xl font-bold text-gray-800">🏆 Top Contributors</h2>
                <Link to="/leaderboard" className="text-indigo-600 hover:underline text-sm font-semibold">View Hall of Fame →</Link>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                {topUsers.map((u, index) => (
                  <div key={u._id} className="min-w-[200px] bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center hover:shadow-lg transition relative">
                    {index < 3 && (
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                        ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                        {index + 1}
                      </div>
                    )}
                    
                    <div className="w-16 h-16 rounded-full bg-indigo-100 overflow-hidden mb-3">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.username} /> : 
                       <div className="w-full h-full flex items-center justify-center font-bold text-indigo-600 text-xl">{u.fullName[0]}</div>}
                    </div>
                    
                    <h3 className="font-bold text-gray-800 truncate w-full text-center">{u.fullName}</h3>
                    <p className="text-xs text-gray-500 mb-2">Lvl {u.level} • {u.xp} XP</p>
                    
                    <div className="flex flex-wrap justify-center gap-1 mb-3">
                      {u.skillsKnown.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div className="w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 ml-2">Your Progress</h2>
              <Analytics />
            </div>
          </>
        ) : (
          <div className="space-x-4 mt-8">
            <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md">Login</Link>
            <Link to="/register" className="px-8 py-3 bg-white text-indigo-600 font-semibold border border-indigo-600 rounded-lg hover:bg-gray-50 transition shadow-md">Sign Up</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;