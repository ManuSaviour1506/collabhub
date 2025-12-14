import { useState } from 'react';
import api from '../../services/api';

const SessionModal = ({ receiverId, receiverName, onClose }) => {
  const [topic, setTopic] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await api.post('/sessions', 
        { receiverId, topic, startTime, duration },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Request Sent!' });
      setTimeout(onClose, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Booking Failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 relative shadow-xl">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">✕</button>
        <h2 className="text-xl font-bold mb-4">Book Session with {receiverName}</h2>
        
        {message && <div className={`p-2 mb-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <form onSubmit={handleBook} className="space-y-4">
          <input className="w-full border p-2 rounded" placeholder="Topic (e.g. React Help)" value={topic} onChange={e => setTopic(e.target.value)} required />
          <div>
            <label className="text-sm text-gray-600">Start Time</label>
            <input type="datetime-local" className="w-full border p-2 rounded" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-gray-600">Duration (mins)</label>
            <select className="w-full border p-2 rounded" value={duration} onChange={e => setDuration(e.target.value)}>
              <option value="30">30 mins</option>
              <option value="60">1 Hour</option>
              <option value="120">2 Hours</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            {loading ? 'Booking...' : 'Send Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;