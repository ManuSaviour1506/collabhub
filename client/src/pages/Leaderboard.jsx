import { useState, useEffect } from 'react';
import api from '../services/api';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.get('/users/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaders(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Top Mentors...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="max-w-3xl w-full">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-800">🏆 Hall of Fame</h1>
          <p className="text-gray-600 mt-2">Top mentors helping the community grow.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="grid grid-cols-12 bg-indigo-600 text-white p-4 font-bold text-sm uppercase tracking-wide">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">User</div>
            <div className="col-span-2 text-center">Level</div>
            <div className="col-span-2 text-center">XP</div>
          </div>

          {/* List */}
          {leaders.map((user, index) => (
            <div 
              key={user._id} 
              className={`grid grid-cols-12 items-center p-4 border-b hover:bg-gray-50 transition ${
                index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-orange-50' : ''
              }`}
            >
              {/* Rank Badge */}
              <div className="col-span-2 flex justify-center">
                {index === 0 ? <span className="text-2xl">🥇</span> :
                 index === 1 ? <span className="text-2xl">🥈</span> :
                 index === 2 ? <span className="text-2xl">🥉</span> :
                 <span className="font-bold text-gray-500">#{index + 1}</span>
                }
              </div>

              {/* User Info */}
              <div className="col-span-6 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white overflow-hidden
                  ${index === 0 ? 'bg-yellow-500' : 'bg-indigo-400'}`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    user.username[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{user.fullName}</p>
                  <p className="text-xs text-gray-500">@{user.username}</p>
                </div>
              </div>

              {/* Level */}
              <div className="col-span-2 text-center font-semibold text-gray-700">
                Lvl {user.level}
              </div>

              {/* XP */}
              <div className="col-span-2 text-center font-bold text-indigo-600">
                {user.xp} XP
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;