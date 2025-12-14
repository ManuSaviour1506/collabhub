import { Link } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';
import Analytics from '../components/dashboard/Analytics';

const Home = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 relative">
      
      {/* Header */}
      {user && (
        <div className="absolute top-5 right-5 flex items-center gap-4 z-20">
          <div className="text-right hidden md:block">
            <span className="block font-bold text-gray-700">{user.username}</span>
            <span className="text-xs text-gray-500">Student</span>
          </div>
          <NotificationBell />
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-5xl flex flex-col items-center mt-20 md:mt-10">
        <h1 className="text-5xl font-bold text-indigo-600 mb-2">CollabHub</h1>
        <p className="text-xl text-gray-600 mb-8">
          The AI-powered platform to learn, teach, and build credibility.
        </p>

        {user ? (
          <>
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-lg w-full mb-8 border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Quick Actions</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                
                <Link to="/profile" className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition">
                  <span className="font-bold">Profile</span>
                </Link>
                
                <Link to="/recommendations" className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition">
                  <span className="font-bold">Mentors</span>
                </Link>
                
                <Link to="/chat" className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                  <span className="font-bold">Chat</span>
                </Link>

                <Link to="/nearby" className="flex flex-col items-center justify-center p-4 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition">
                  <span className="font-bold">📍 Nearby</span>
                </Link>
                
                <Link to="/wallet" className="flex flex-col items-center justify-center p-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition">
                  <span className="font-bold">Wallet</span>
                </Link>
                
                <Link to="/learn" className="flex flex-col items-center justify-center p-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition">
                  <span className="font-bold">AI Tutor</span>
                </Link>

                <Link to="/leaderboard" className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition">
                  <span className="font-bold">Hall of Fame</span>
                </Link>

                <button onClick={logout} className="flex flex-col items-center justify-center p-4 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition">
                  <span className="font-bold">Logout</span>
                </button>
              </div>
            </div>

            {/* Analytics Section */}
            <div className="w-full">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 ml-2">Your Progress</h2>
              <Analytics />
            </div>
          </>
        ) : (
          <div className="space-x-4 mt-8">
            <Link to="/login" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition shadow-md">
              Login
            </Link>
            <Link to="/register" className="px-8 py-3 bg-white text-indigo-600 font-semibold border border-indigo-600 rounded-lg hover:bg-gray-50 transition shadow-md">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;