import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import AuthContext from '../context/AuthContext';
import { CheckIcon, XMarkIcon, ClockIcon, AcademicCapIcon, BoltIcon, StarIcon } from '@heroicons/react/24/solid'; // Added StarIcon
import toast from 'react-hot-toast';
import RatingModal from '../components/common/RatingModal'; // <-- NEW IMPORT

const Sessions = () => {
  const { user } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Rating State
  const [ratingTarget, setRatingTarget] = useState(null); // { id, fullName }

  // Helper: check if current user is the requester (sender)
  const isSender = (session) => session.sender._id === user._id;

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.get('/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch sessions.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, newStatus, session) => {
    const toastId = toast.loading(`Updating session status to ${newStatus}...`);
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await api.put(`/sessions/${sessionId}/status`, { newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchSessions(); 
      toast.success(`Session ${newStatus}!`, { id: toastId });

      // Trigger Rating Modal after completion
      if (newStatus === 'completed') {
        const peer = isSender(session) ? session.receiver : session.sender;
        setRatingTarget({ 
            id: peer._id, 
            fullName: peer.fullName 
        });
      }

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || `Failed to ${newStatus} session.`, { id: toastId });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) return <div className="p-8 text-center text-indigo-600 font-bold">Loading Sessions...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <AcademicCapIcon className="w-8 h-8 text-indigo-600"/> Session Manager
        </h1>

        {sessions.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow-md text-center text-gray-500">
            <p className="text-lg">You have no active or past sessions.</p>
            <p className="mt-2 text-sm">Find a mentor on the <Link to="/recommendations" className="text-indigo-600 hover:underline font-semibold">Recommendations</Link> page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <div key={session._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
                
                {/* Details */}
                <div className="md:flex-1 mb-4 md:mb-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${getStatusClass(session.status)}`}>
                    {session.status.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 mt-1">{session.topic}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isSender(session) ? 
                      `To: ${session.receiver.fullName} (@${session.receiver.username})` : 
                      `From: ${session.sender.fullName} (@${session.sender.username})`
                    }
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <ClockIcon className="w-4 h-4 text-indigo-400" />
                    {new Date(session.startTime).toLocaleString()} ({session.duration} mins)
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  
                  {session.status === 'pending' && !isSender(session) && (
                    <>
                      {/* Mentor/Receiver Actions */}
                      <button onClick={() => handleUpdateStatus(session._id, 'accepted', session)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" /> Accept
                      </button>
                      <button onClick={() => handleUpdateStatus(session._id, 'cancelled', session)} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 flex items-center gap-1">
                        <XMarkIcon className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}

                  {session.status === 'accepted' && (
                    <>
                        <Link to={`/classroom/${session._id}`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-1">
                            <BoltIcon className='w-4 h-4'/> Start Session
                        </Link>
                        {/* Mark Complete button visible to both participants */}
                        <button onClick={() => handleUpdateStatus(session._id, 'completed', session)} className="bg-gray-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800">
                            Mark Complete
                        </button>
                    </>
                  )}
                  
                  {session.status === 'pending' && isSender(session) && (
                    <button disabled className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold cursor-not-allowed">
                       Awaiting Approval
                    </button>
                  )}

                  {session.status === 'completed' && (
                    <button 
                        onClick={() => {
                            const peer = isSender(session) ? session.receiver : session.sender;
                            setRatingTarget({ id: peer._id, fullName: peer.fullName });
                        }}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 flex items-center gap-1"
                    >
                        <StarIcon className="w-4 h-4"/> Rate Peer
                    </button>
                  )}
                  
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      
      {/* RATING MODAL RENDER */}
      {ratingTarget && (
        <RatingModal
            ratedUserId={ratingTarget.id}
            ratedUserName={ratingTarget.fullName}
            onClose={() => setRatingTarget(null)}
        />
      )}
    </div>
  );
};

export default Sessions;