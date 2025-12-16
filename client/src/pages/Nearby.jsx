import { useState, useEffect } from 'react';
import api from '../services/api';
import SessionModal from '../components/sessions/SessionModal';
import toast from 'react-hot-toast';

const Nearby = () => {
  const [mentors, setMentors] = useState([]);
  const [locationShared, setLocationShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // 1. Get User Location
  const shareLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        // API call to update user's location coordinates
        await api.put('/nearby/location', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }, { headers: { Authorization: `Bearer ${token}` } });
        
        setLocationShared(true);
        fetchNearbyMentors();
      } catch (error) {
        console.error(error);
        toast.error("Failed to update location");
      } finally {
        setLoading(false);
      }
    });
  };

  // 2. Fetch Nearby Users
  const fetchNearbyMentors = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      // Search within 50km radius
      const { data } = await api.get('/nearby/search?radius=50', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentors(data);
    } catch (error) { console.error(error); }
  };

  // Add useEffect to fetch mentors when location is shared
  useEffect(() => {
    if (locationShared) {
        fetchNearbyMentors();
    }
  }, [locationShared]);


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📍 Nearby Mentors</h1>
            <p className="text-gray-600">Find skilled peers in your local area.</p>
          </div>
          <button 
            onClick={shareLocation}
            className={`px-6 py-2 rounded-full font-bold text-white transition ${locationShared ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Locating...' : locationShared ? 'Location Active' : '📍 Share My Location'}
          </button>
        </div>

        {!locationShared ? (
          <div className="bg-white p-10 rounded-lg shadow text-center">
            <p className="text-xl text-gray-500">Please share your location to see who is nearby!</p>
          </div>
        ) : mentors.length === 0 ? (
          <div className="bg-white p-10 rounded-lg shadow text-center">
            <p className="text-xl text-gray-500">No mentors found nearby yet. Try again later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 overflow-hidden">
                    {mentor.avatar ? (
                       <img src={mentor.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                       mentor.fullName[0]
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{mentor.fullName}</h3>
                    <p className="text-sm text-gray-500">@{mentor.username}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {mentor.skillsKnown.map((skill, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{skill}</span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedMentor(mentor)}
                  className="w-full border border-indigo-600 text-indigo-600 py-2 rounded hover:bg-indigo-50 transition"
                >
                  Schedule Session
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedMentor && (
          <SessionModal
            receiverId={selectedMentor._id}
            receiverName={selectedMentor.fullName}
            onClose={() => setSelectedMentor(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Nearby;