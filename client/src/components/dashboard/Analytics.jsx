import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.get('/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading analytics...</div>;
  if (!stats) return null;

  return (
    <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. Level & XP Card */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-50">
        <h3 className="text-lg font-bold text-gray-700 mb-2">Level Progress</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-indigo-600">Lvl {stats.level}</span>
          <span className="text-sm text-gray-500">{stats.xp} Total XP</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-indigo-600 h-4 rounded-full transition-all duration-1000" 
            style={{ width: `${stats.xpProgress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          {Math.round(100 - stats.xpProgress)} XP needed for Level {stats.level + 1}
        </p>
      </div>

      {/* 2. Wallet Activity Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-50">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Weekly Wallet Activity</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.activityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <Tooltip />
              <Bar dataKey="earned" fill="#10B981" name="Earned" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="#EF4444" name="Spent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
};

export default Analytics;