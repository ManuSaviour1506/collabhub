import { useParams } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Whiteboard from '../components/classroom/Whiteboard';

const Classroom = () => {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🎓 Live Classroom</h1>
            <p className="text-gray-500">Room ID: <span className="font-mono bg-white px-2 py-1 rounded">{roomId}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-green-700 font-bold">Live Connection</span>
          </div>
        </div>

        <Whiteboard roomId={roomId} user={user} />
        
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Share this URL with your peer to collaborate in real-time.</p>
        </div>

      </div>
    </div>
  );
};

export default Classroom;