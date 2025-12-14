import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Recommendations = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.get('/recommendations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMatches(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch recommendations", err);
        setError('Could not load recommendations. Please try again later.');
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  // Logic to start a chat when "Connect" is clicked
  const handleConnect = async (userId) => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      // Call the API to create or retrieve a chat with this user
      await api.post('/chat', 
        { userId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirect to the chat page
      navigate('/chat');
    } catch (error) {
      alert("Failed to connect with user.");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Finding your best learning partners...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Recommended Mentors & Peers</h1>
        <p className="text-gray-600 mb-8">Based on the skills you want to learn, here are the best people to connect with.</p>
        
        {matches.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-xl font-medium text-gray-700">No matches found yet.</h3>
            <p className="text-gray-500 mt-2">Try adding more "Skills Wanted" in your profile!</p>
            <button 
              onClick={() => navigate('/profile')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{match.fullName}</h3>
                      <p className="text-sm text-gray-500">@{match.username}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                      {match.matchScore}% Match
                    </span>
                  </div>

                  {match.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {match.bio}
                    </p>
                  )}
                  
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Can Teach You:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchingSkills && match.matchingSkills.length > 0 ? (
                        match.matchingSkills.map((skill, index) => (
                          <span key={index} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded border border-indigo-200">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm italic">General Match</span>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleConnect(match._id)}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Message & Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;