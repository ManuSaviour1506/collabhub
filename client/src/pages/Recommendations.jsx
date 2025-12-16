import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SparklesIcon } from '@heroicons/react/24/solid';

const Recommendations = () => {
  // Data State
  const [recommendations, setRecommendations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Search State
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();

  // 1. Fetch Initial Data (Algo Recommendations + Community)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch Algorithm Matches
        const recRes = await api.get('/recommendations', { headers });
        setRecommendations(recRes.data);

        // Fetch All Users (Explore)
        const allRes = await api.get('/users/all', { headers });
        setAllUsers(allRes.data);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        toast.error("Failed to load community data.");
      }
    };
    fetchData();
  }, []);

  // 2. Handle "Connect/Message" Click
  const handleConnect = async (userId) => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      // Create/Fetch Chat Room
      await api.post('/chat', { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Redirect
      navigate('/chat');
    } catch (error) {
      toast.error("Could not start chat.");
      console.error(error);
    }
  };

  // 3. Handle AI Semantic Search
  const handleAIMatch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      // FIX: Use the correct API route defined in recommendation.routes.js 
      // which is POST /api/recommendations/ai
      const { data } = await api.post('/recommendations/ai', // <-- CORRECTED PATH
        { prompt: query }, // Send query as 'prompt' to match the Node.js controller
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMatches(data);
      if (data.length > 0) {
        toast.success(`Found ${data.length} AI matches!`);
      } else {
        toast('No strong matches found. Try a different description.', { icon: '🤔' });
      }
    } catch (error) {
      // NOTE: The previous 500 error was likely due to the Node server not having 
      // the correct route or crashing on the backend axios call.
      toast.error("AI Match failed. Check the Node.js server log for Python errors.");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-600 font-bold">Finding community members...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* --- SECTION 1: AI MATCHMAKER --- */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <SparklesIcon className="w-8 h-8 text-yellow-300" />
              Find Your Perfect Collaborator
            </h1>
            <p className="text-indigo-100 mb-6 max-w-2xl">
              Don't just search for keywords. Describe your project (e.g., "I need to build a drone with Python") and our AI will understand the context to find experts.
            </p>

            <form onSubmit={handleAIMatch} className="flex gap-4 max-w-3xl">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe what you are looking for..."
                className="flex-1 p-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-300 shadow-lg"
              />
              <button 
                type="submit" 
                disabled={isSearching}
                className="bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition shadow-lg flex items-center gap-2"
              >
                {isSearching ? 'Thinking...' : 'AI Match'}
              </button>
            </form>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
        </div>

        {/* --- SECTION 2: AI MATCH RESULTS --- */}
        {matches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🎯</span> Top Matches
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((user) => (
                <div key={user._id} className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 relative overflow-hidden hover:shadow-lg transition">
                   {/* Match Score Badge */}
                   <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                     {user.matchScore}% Match
                   </div>

                   {/* User Card Content */}
                   <div className="flex items-center gap-4 mb-4">
                     <img 
                        src={user.avatar || "https://via.placeholder.com/150"} 
                        className="w-12 h-12 rounded-full object-cover bg-gray-200" 
                        alt={user.fullName}
                     />
                     <div>
                       <h3 className="font-bold text-gray-800 leading-tight">{user.fullName}</h3>
                       <p className="text-xs text-gray-500">@{user.username}</p>
                     </div>
                   </div>
                   <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">{user.bio || "No bio available."}</p>
                   
                   {/* Connect Button */}
                   <button 
                     onClick={() => handleConnect(user._id)} 
                     className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition"
                   >
                     Connect
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SECTION 3: ALGORITHM RECOMMENDATIONS --- */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-indigo-800">⚡ Smart Matches</h2>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Based on Skills</span>
          </div>
          
          {recommendations.length === 0 ? (
             <p className="text-gray-500 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               No direct skill matches found yet. Update your profile skills to get better suggestions!
             </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((user) => (
                <div key={user._id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500 flex flex-col justify-between hover:shadow-lg transition">
                   <div>
                     <div className="flex items-center gap-4 mb-3">
                       <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                         {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt={user.fullName}/> : <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{user.fullName[0]}</div>}
                       </div>
                       <div>
                         <h2 className="text-lg font-bold text-gray-800">{user.fullName}</h2>
                         <p className="text-xs text-gray-500">@{user.username}</p>
                       </div>
                     </div>
                     <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{user.bio || "No bio yet."}</p>
                     <div className="flex flex-wrap gap-2 mb-4">
                       {user.skillsKnown.slice(0, 4).map((skill, i) => (
                         <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">{skill}</span>
                       ))}
                     </div>
                   </div>
                   
                   <button 
                     onClick={() => handleConnect(user._id)}
                     className="block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium"
                   >
                     Message
                   </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- SECTION 4: EXPLORE COMMUNITY (ALL USERS) --- */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">🌍 Explore Community</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allUsers.map((user) => (
              <div key={user._id} className="bg-white p-5 rounded-lg shadow hover:shadow-lg transition duration-300 border border-gray-100 flex flex-col items-center text-center">
                  
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-gray-100 mb-3 overflow-hidden border-2 border-white shadow-sm">
                     {user.avatar ? (
                       <img src={user.avatar} className="w-full h-full object-cover" alt={user.fullName} />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">{user.fullName[0]}</div>
                     )}
                  </div>
                  
                  {/* Details */}
                  <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{user.fullName}</h3>
                  <p className="text-xs text-indigo-600 font-semibold mb-3">Lvl {user.level} • {user.xp} XP</p>
                  
                  {/* Skills Preview */}
                  <div className="flex flex-wrap justify-center gap-1 mb-4 h-12 overflow-hidden content-start">
                    {user.skillsKnown.slice(0, 3).map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">{skill}</span>
                    ))}
                    {user.skillsKnown.length > 3 && <span className="text-[10px] text-gray-400 self-center">+{user.skillsKnown.length - 3}</span>}
                  </div>

                  {/* Message Button */}
                  <button 
                    onClick={() => handleConnect(user._id)}
                    className="w-full py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <span>💬</span> Message
                  </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Recommendations;