import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);

  // Debounce Search: Only API call 500ms after user stops typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        try {
          const token = JSON.parse(localStorage.getItem('user')).token;
          const { data } = await api.get(`/search?q=${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setResults(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ users: [], projects: [] });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Search Bar */}
        <div className="mb-8 relative">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">🔍 Explore CollabHub</h1>
          <input 
            type="text" 
            className="w-full p-4 pl-12 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition text-lg shadow-sm"
            placeholder="Search for skills, mentors, or projects (e.g. 'React', 'Python')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="absolute left-4 top-[3.5rem] text-gray-400 text-xl">🔎</span>
        </div>

        {loading && <div className="text-center text-gray-500 py-8">Searching...</div>}

        {!loading && query && results.users.length === 0 && results.projects.length === 0 && (
          <div className="text-center text-gray-400 py-8">No results found for "{query}"</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MENTOR RESULTS */}
          {results.users.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">👥 Mentors & Peers</h2>
              <div className="space-y-4">
                {results.users.map(user => (
                  <div key={user._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-4 border border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center font-bold text-indigo-600">
                       {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.fullName[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{user.fullName}</h3>
                      <p className="text-xs text-gray-500">Lvl {user.level} • {user.xp} XP</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.skillsKnown.slice(0, 3).map((s, i) => (
                           <span key={i} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{s}</span>
                        ))}
                      </div>
                    </div>
                    <Link to="/chat" className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-full">
                      💬
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECT RESULTS */}
          {results.projects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">🚀 Projects</h2>
              <div className="space-y-4">
                {results.projects.map(proj => (
                  <div key={proj._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100">
                    <h3 className="font-bold text-indigo-700">{proj.title}</h3>
                    <p className="text-xs text-gray-500 mb-2 truncate">{proj.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {proj.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                    <Link to={`/project/${proj._id}`} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">
                      View Board
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Search;