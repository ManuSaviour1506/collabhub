import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user } = useContext(AuthContext);
  
  // Profile Form State
  const [formData, setFormData] = useState({
    fullName: '', 
    email: '', 
    bio: '', 
    skillsKnown: '', 
    skillsWanted: '',
    xp: 0, 
    avatar: '' // Store avatar URL
  });

  // Image Upload State
  const [avatarFile, setAvatarFile] = useState(null);

  // Project Form State
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', link: '', tags: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', content: '' });

  // Helper: Convert File to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // 1. Fetch Profile AND Projects Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch User Info
        const userRes = await api.get('/users/profile', { headers });
        setFormData({
          fullName: userRes.data.fullName,
          email: userRes.data.email,
          bio: userRes.data.bio || '',
          skillsKnown: userRes.data.skillsKnown ? userRes.data.skillsKnown.join(', ') : '',
          skillsWanted: userRes.data.skillsWanted ? userRes.data.skillsWanted.join(', ') : '',
          xp: userRes.data.xp || 0,
          avatar: userRes.data.avatar || ''
        });

        // Fetch My Projects
        const projectRes = await api.get('/projects/my', { headers });
        setProjects(projectRes.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data", error);
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  // 2. Handle Profile Update (including Image)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      let avatarBase64 = null;
      if (avatarFile) {
        avatarBase64 = await convertToBase64(avatarFile);
      }

      const updateData = {
        fullName: formData.fullName,
        bio: formData.bio,
        skillsKnown: formData.skillsKnown.split(',').map(s => s.trim()).filter(s => s),
        skillsWanted: formData.skillsWanted.split(',').map(s => s.trim()).filter(s => s),
        avatarBase64: avatarBase64 // Send image data if exists
      };

      const { data } = await api.put('/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update Local Storage & State
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data }));
      
      // Update local state with new avatar URL if returned
      setFormData(prev => ({ ...prev, avatar: data.avatar }));
      setAvatarFile(null); // Reset file input

      setMessage({ type: 'success', content: 'Profile updated successfully!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', content: 'Update failed. Check file size (<2MB) or connection.' });
    }
  };

  // 3. Handle Add New Project
  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      const projectData = {
        ...newProject,
        tags: newProject.tags.split(',').map(s => s.trim()).filter(s => s)
      };

      const { data } = await api.post('/projects', projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProjects([...projects, data]); 
      setNewProject({ title: '', description: '', link: '', tags: '' });
      setShowProjectForm(false);
      setMessage({ type: 'success', content: 'Project added to portfolio! (+100 XP)' });
      
      setFormData(prev => ({ ...prev, xp: prev.xp + 100 }));

    } catch (error) {
      setMessage({ type: 'error', content: 'Failed to add project.' });
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Notification Banner */}
        {message.content && (
          <div className={`p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.content}
          </div>
        )}

        {/* --- SECTION 1: PERSONAL DETAILS --- */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Profile</h1>
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            
            {/* Avatar Upload Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 mb-4 shadow-sm relative">
                {avatarFile ? (
                  // Show preview of selected file
                  <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : formData.avatar ? (
                  // Show current avatar from DB
                  <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  // Show Placeholder
                  <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-4xl font-bold">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-full transition text-sm">
                Change Photo
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-400 mt-2">Max size 2MB. JPG/PNG.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded focus:outline-indigo-500"
                  value={formData.fullName} 
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Email (Read-only)</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-gray-100 border rounded cursor-not-allowed"
                  value={formData.email} 
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Bio</label>
              <textarea 
                className="w-full p-3 border rounded focus:outline-indigo-500"
                rows="3"
                value={formData.bio} 
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Skills to Teach</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded focus:outline-indigo-500"
                  placeholder="React, Math, Physics"
                  value={formData.skillsKnown} 
                  onChange={(e) => setFormData({...formData, skillsKnown: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Skills to Learn</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded focus:outline-indigo-500"
                  placeholder="Python, History"
                  value={formData.skillsWanted} 
                  onChange={(e) => setFormData({...formData, skillsWanted: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition w-full md:w-auto">
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* --- SECTION 2: CREDIBILITY & BADGES --- */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Credibility & Badges</h2>
          <div className="flex items-center gap-6">
            
            {/* Level Badge */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                {Math.floor((formData.xp || 0) / 100) + 1}
              </div>
              <span className="mt-2 font-bold text-gray-700">Level</span>
            </div>

            {/* Dynamic Badges based on Level */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-100 min-w-[80px]" title="Joined the platform early">
                <span className="text-2xl">🚀</span>
                <span className="text-xs font-bold text-blue-800 mt-1">Early Bird</span>
              </div>

              {(Math.floor((formData.xp || 0) / 100) + 1) >= 2 && (
                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100 min-w-[80px]" title="Reached Level 2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-xs font-bold text-yellow-800 mt-1">Rising Star</span>
                </div>
              )}

              {(Math.floor((formData.xp || 0) / 100) + 1) >= 5 && (
                <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-100 min-w-[80px]" title="Reached Level 5">
                  <span className="text-2xl">👑</span>
                  <span className="text-xs font-bold text-purple-800 mt-1">Expert</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- SECTION 3: PROJECT PORTFOLIO --- */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Projects</h2>
            <button 
              onClick={() => setShowProjectForm(!showProjectForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              {showProjectForm ? 'Cancel' : '+ Add Project'}
            </button>
          </div>

          {/* Add Project Form */}
          {showProjectForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-indigo-100 shadow-inner">
              <h3 className="font-bold text-lg mb-4 text-indigo-800">Add New Project</h3>
              <form onSubmit={handleAddProject} className="space-y-4">
                <input 
                  type="text" placeholder="Project Title" className="w-full p-2 border rounded" required
                  value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                />
                <textarea 
                  placeholder="Description (What did you build?)" className="w-full p-2 border rounded" rows="2" required
                  value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
                <input 
                  type="url" placeholder="Project Link (GitHub/Demo)" className="w-full p-2 border rounded"
                  value={newProject.link} onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                />
                <input 
                  type="text" placeholder="Tags (e.g. React, Node.js)" className="w-full p-2 border rounded"
                  value={newProject.tags} onChange={(e) => setNewProject({...newProject, tags: e.target.value})}
                />
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                  Publish Project (+100 XP)
                </button>
              </form>
            </div>
          )}

          {/* Projects List */}
          {projects.length === 0 ? (
            <p className="text-gray-500 italic text-center py-4">No projects added yet. Add projects to unlock Kanban boards!</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((proj) => (
                <div key={proj._id} className="border border-gray-200 p-5 rounded-lg hover:shadow-lg transition bg-white">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl text-gray-800">{proj.title}</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">Verified</span>
                  </div>
                  <p className="text-gray-600 mt-2">{proj.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {proj.tags.map((tag, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2 py-1 rounded">{tag}</span>
                    ))}
                  </div>

                  {/* Task Board Link Section */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <Link 
                      to={`/project/${proj._id}`} 
                      className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Open Task Board
                    </Link>

                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="text-gray-500 text-sm hover:text-blue-600 hover:underline flex items-center gap-1">
                        External Link
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;