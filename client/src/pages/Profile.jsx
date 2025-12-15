import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import QuizModal from '../components/common/QuizModal';
import { toast } from 'react-hot-toast';
import { 
  PencilSquareIcon, 
  CheckCircleIcon, 
  XMarkIcon, 
  ArrowUpTrayIcon,
  BriefcaseIcon,
  AcademicCapIcon
} from '@heroicons/react/24/solid';

const Profile = () => {
  const { user, login } = useContext(AuthContext); // login used to update local storage if needed
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Resume Parsing State
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  // Profile Data State
  const [formData, setFormData] = useState({
    fullName: '', 
    email: '', 
    bio: '', 
    skillsKnown: '', 
    skillsWanted: '',
    xp: 0,
    level: 1,
    credits: 0,
    avatar: '' 
  });

  // Avatar State
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Project State
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', link: '', tags: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);
  
  // Quiz State
  const [quizSkill, setQuizSkill] = useState(null);

  // --- 1. FETCH DATA (Profile + Projects) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const headers = { Authorization: `Bearer ${token}` };

        // Parallel Fetch
        const [userRes, projectRes] = await Promise.all([
          api.get('/users/profile', { headers }),
          api.get('/projects/my', { headers })
        ]);

        // Set Profile Data
        setFormData({
          fullName: userRes.data.fullName,
          email: userRes.data.email,
          bio: userRes.data.bio || '',
          skillsKnown: userRes.data.skillsKnown ? userRes.data.skillsKnown.join(', ') : '',
          skillsWanted: userRes.data.skillsWanted ? userRes.data.skillsWanted.join(', ') : '',
          xp: userRes.data.xp || 0,
          level: userRes.data.level || 1,
          credits: userRes.data.credits || 0,
          avatar: userRes.data.avatar || ''
        });

        // Set Projects Data
        setProjects(projectRes.data);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching data", error);
        toast.error("Failed to load profile data.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. RESUME PARSER (AI) ---
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return toast.error("Please upload a PDF file.");
    }

    setIsParsing(true);
    const uploadData = new FormData();
    uploadData.append('resume', file);

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      toast.loading("AI is analyzing your resume...", { id: 'resumeLoad' });

      // Call the Node.js -> Python Resume Parser
      const { data } = await api.post('/users/parse-resume', uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Auto-fill form
      setFormData(prev => ({
        ...prev,
        fullName: data.fullName !== "Unknown User" ? data.fullName : prev.fullName,
        bio: data.bio || prev.bio,
        skillsKnown: data.skillsKnown.length > 0 ? data.skillsKnown.join(', ') : prev.skillsKnown
      }));

      toast.success("Profile auto-filled from Resume!", { id: 'resumeLoad' });
      setIsEditing(true); // Switch to edit mode so user can review
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to parse resume.", { id: 'resumeLoad' });
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- 3. SAVE PROFILE ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Saving changes...');
    
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      // Convert Avatar to Base64 if changed
      let avatarBase64 = null;
      if (avatarFile) {
        avatarBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(avatarFile);
        });
      }

      const updateData = {
        fullName: formData.fullName,
        bio: formData.bio,
        skillsKnown: formData.skillsKnown.split(',').map(s => s.trim()).filter(s => s),
        skillsWanted: formData.skillsWanted.split(',').map(s => s.trim()).filter(s => s),
        avatarBase64: avatarBase64 
      };

      const { data } = await api.put('/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update LocalStorage to keep Header/AuthContext in sync
      const currentUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data }));
      
      setFormData(prev => ({ ...prev, avatar: data.avatar }));
      setAvatarFile(null);
      setIsEditing(false);

      toast.success('Profile updated successfully!', { id: toastId });

    } catch (error) {
      console.error(error);
      toast.error('Update failed. Check file size (<2MB).', { id: toastId });
    }
  };

  // --- 4. ADD PROJECT ---
  const handleAddProject = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Adding project...');

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
      
      // Update XP locally (Visual only, backend handles actual logic)
      setFormData(prev => ({ ...prev, xp: prev.xp + 100 }));

      toast.success('Project added! (+100 XP)', { id: toastId, icon: '🚀' });

    } catch (error) {
      toast.error('Failed to add project.', { id: toastId });
    }
  };

  // --- 5. HANDLE AVATAR PREVIEW ---
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-indigo-600">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">


        
        {/* ================= HEADER & RESUME PARSER ================= */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-48 relative">
             {/* Resume Upload Button (Top Right) */}
             <div className="absolute top-4 right-4 z-10">
               <input 
                 type="file" 
                 accept="application/pdf" 
                 className="hidden" 
                 ref={fileInputRef} 
                 onChange={handleResumeUpload}
               />
               <button 
                 onClick={() => fileInputRef.current.click()}
                 disabled={isParsing}
                 className="bg-white/20 backdrop-blur-md border border-white/50 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition flex items-center gap-2 shadow-lg"
               >
                 {isParsing ? (
                   <span className="animate-pulse">Parsing...</span>
                 ) : (
                   <>
                     <ArrowUpTrayIcon className="w-5 h-5" />
                     <span>Auto-Fill from Resume</span>
                   </>
                 )}
               </button>
            </div>
          </div>

          <div className="px-8 pb-8">
            {/* Avatar & Edit Actions */}
            <div className="relative -mt-20 mb-6 flex justify-between items-end">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover" />
                  ) : formData.avatar ? (
                    <img src={formData.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400 font-bold">
                      {formData.fullName ? formData.fullName[0] : 'U'}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-md">
                    <PencilSquareIcon className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                )}
              </div>

              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-indigo-700 transition flex items-center gap-2"
                >
                  <PencilSquareIcon className="w-5 h-5" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => { setIsEditing(false); setPreview(null); }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-300 transition flex items-center gap-2"
                  >
                    <XMarkIcon className="w-5 h-5" /> Cancel
                  </button>
                  <button 
                    onClick={handleProfileUpdate}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <CheckCircleIcon className="w-5 h-5" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                  <input 
                    type="text" 
                    disabled
                    value={formData.email}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                <textarea 
                  rows="3"
                  disabled={!isEditing}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Skills You Know (Teach)</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.skillsKnown}
                    onChange={(e) => setFormData({...formData, skillsKnown: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                  {!isEditing && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.skillsKnown.split(',').map((s, i) => s.trim() && (
                        <div key={i} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold border border-green-200">
                          {s.trim()}
                          <button 
                            type="button"
                            onClick={() => setQuizSkill(s.trim())}
                            className="ml-1 text-xs bg-white text-green-700 border border-green-300 rounded px-1 hover:bg-green-50"
                            title="Take Quiz"
                          >
                            Verify?
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Skills You Want (Learn)</label>
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.skillsWanted}
                    onChange={(e) => setFormData({...formData, skillsWanted: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500 transition"
                  />
                </div>
              </div>

              {/* Stats Bar */}
              <div className="pt-4 border-t mt-4 flex justify-between items-center text-center">
                 <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wide">Level</span>
                    <div className="text-3xl font-black text-indigo-600">{formData.level}</div>
                 </div>
                 <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wide">XP</span>
                    <div className="text-3xl font-black text-green-600">{formData.xp}</div>
                 </div>
                 <div>
                    <span className="text-gray-500 text-xs uppercase font-bold tracking-wide">Wallet</span>
                    <div className="text-3xl font-black text-yellow-600">{formData.credits} 🪙</div>
                 </div>
              </div>
            </form>
          </div>
        </div>

        {/* ================= BADGES SECTION ================= */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
            Badges & Credibility
          </h2>
          <div className="flex gap-4 flex-wrap">
              <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-100 min-w-[100px]">
                <span className="text-3xl">🚀</span>
                <span className="text-xs font-bold text-blue-800 mt-1">Early Bird</span>
              </div>
              {formData.xp >= 200 && (
                <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100 min-w-[100px]">
                  <span className="text-3xl">⭐</span>
                  <span className="text-xs font-bold text-yellow-800 mt-1">Rising Star</span>
                </div>
              )}
              {formData.xp >= 1000 && (
                <div className="flex flex-col items-center p-3 bg-purple-50 rounded-lg border border-purple-100 min-w-[100px]">
                  <span className="text-3xl">👑</span>
                  <span className="text-xs font-bold text-purple-800 mt-1">Expert</span>
                </div>
              )}
          </div>
        </div>

        {/* ================= PROJECT PORTFOLIO ================= */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BriefcaseIcon className="w-6 h-6 text-indigo-600" />
              My Projects
            </h2>
            <button 
              onClick={() => setShowProjectForm(!showProjectForm)}
              className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition"
            >
              {showProjectForm ? 'Cancel' : '+ Add Project'}
            </button>
          </div>

          {/* Add Project Form */}
          {showProjectForm && (
            <div className="bg-indigo-50 p-6 rounded-lg mb-6 border border-indigo-100 animate-fadeIn">
              <h3 className="font-bold text-lg mb-4 text-indigo-800">New Project Details</h3>
              <form onSubmit={handleAddProject} className="space-y-4">
                <input 
                  type="text" placeholder="Project Title" className="w-full p-3 border rounded-lg" required
                  value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                />
                <textarea 
                  placeholder="Description (What did you build?)" className="w-full p-3 border rounded-lg" rows="2" required
                  value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="url" placeholder="Project Link (GitHub/Demo)" className="w-full p-3 border rounded-lg"
                    value={newProject.link} onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                  />
                  <input 
                    type="text" placeholder="Tags (React, Node.js)" className="w-full p-3 border rounded-lg"
                    value={newProject.tags} onChange={(e) => setNewProject({...newProject, tags: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md">
                  🚀 Publish Project (+100 XP)
                </button>
              </form>
            </div>
          )}

          {/* Projects List */}
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              <p>No projects added yet.</p>
              <p className="text-sm mt-1">Add projects to unlock Kanban boards and earn XP!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((proj) => (
                <div key={proj._id} className="border border-gray-100 p-5 rounded-xl hover:shadow-lg transition bg-white group">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition">{proj.title}</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">Verified</span>
                  </div>
                  <p className="text-gray-600 mt-2 text-sm">{proj.description}</p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {proj.tags.map((tag, i) => (
                      <span key={i} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">{tag}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                    <Link 
                      to={`/project/${proj._id}`} 
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      <BriefcaseIcon className="w-4 h-4" /> Open Task Board
                    </Link>
                    
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="text-gray-500 text-sm hover:text-indigo-600 font-medium flex items-center gap-1">
                        View Demo ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- MODALS --- */}
        {quizSkill && (
          <QuizModal 
            skill={quizSkill} 
            onClose={() => setQuizSkill(null)}
            onVerified={() => {
               setFormData(prev => ({ ...prev, xp: prev.xp + 50 })); 
               toast.success(`Verified: ${quizSkill}! (+50 XP)`, { icon: '🎓' });
               setQuizSkill(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

export default Profile;