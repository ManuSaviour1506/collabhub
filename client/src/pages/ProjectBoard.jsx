import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  SparklesIcon, 
  PlusIcon, 
  ArrowRightIcon, 
  CheckCircleIcon,
  TrashIcon 
} from '@heroicons/react/24/solid';

const ProjectBoard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.get(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load project");
      setLoading(false);
    }
  };

  // --- AI GENERATOR ---
  const handleAIGenerate = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("AI is planning your project...");
    
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.post(`/projects/${id}/generate-tasks`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // The backend returns { project: ..., message: ... }
      setProject(data.project || data); 
      toast.success("Plan Generated!", { id: toastId, icon: '✨' });
    } catch (error) {
      console.error(error);
      toast.error("AI Generation failed.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.post(`/projects/${id}/tasks`, { title: newTask }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(data);
      setNewTask('');
      toast.success("Task added");
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  const moveTask = async (taskId, newStatus) => {
    // Optimistic Update
    const updatedTasks = project.tasks.map(t => 
      t._id === taskId ? { ...t, status: newStatus } : t
    );
    setProject({ ...project, tasks: updatedTasks });

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      await api.put(`/projects/${id}/tasks/status`, 
        { taskId, status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      toast.error("Failed to move task");
      fetchProject(); // Revert
    }
  };

  const getTasks = (status) => project?.tasks.filter(t => t.status === status) || [];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Board...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link to="/profile" className="text-sm text-gray-500 hover:text-indigo-600 mb-1 block">← Back to Profile</Link>
            <h1 className="text-3xl font-bold text-gray-800">{project.title}</h1>
            <p className="text-gray-500 max-w-2xl">{project.description}</p>
          </div>
          
          <button 
            onClick={handleAIGenerate}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-2"
          >
            {isGenerating ? (
              <span className="animate-pulse">Thinking...</span>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 text-yellow-300" />
                AI Generate Plan
              </>
            )}
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* TO DO COLUMN */}
          <div className="bg-gray-100 p-4 rounded-xl min-h-[500px]">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="bg-gray-400 w-3 h-3 rounded-full block"></span> 
              To Do ({getTasks('todo').length})
            </h2>
            
            <div className="space-y-3">
              {getTasks('todo').map(task => (
                <div key={task._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group hover:border-indigo-300 transition">
                  <p className="text-gray-800 font-medium mb-3">{task.title}</p>
                  <button 
                    onClick={() => moveTask(task._id, 'doing')}
                    className="w-full text-xs bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 font-bold flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition"
                  >
                    Start <ArrowRightIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Task Input */}
            <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="+ Add task..."
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 shadow-sm">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="bg-blue-50 p-4 rounded-xl min-h-[500px]">
            <h2 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-500 w-3 h-3 rounded-full block animate-pulse"></span> 
              In Progress ({getTasks('doing').length})
            </h2>
            
            <div className="space-y-3">
              {getTasks('doing').map(task => (
                <div key={task._id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 transform transition hover:-translate-y-1">
                  <p className="text-gray-800 font-medium mb-3">{task.title}</p>
                  <button 
                    onClick={() => moveTask(task._id, 'done')}
                    className="w-full text-xs bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 font-bold flex items-center justify-center gap-1"
                  >
                    Complete <CheckCircleIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DONE COLUMN */}
          <div className="bg-green-50 p-4 rounded-xl min-h-[500px]">
            <h2 className="font-bold text-green-800 mb-4 flex items-center gap-2">
              <span className="bg-green-500 w-3 h-3 rounded-full block"></span> 
              Done ({getTasks('done').length})
            </h2>
            
            <div className="space-y-3">
              {getTasks('done').map(task => (
                <div key={task._id} className="bg-white p-4 rounded-lg shadow-sm border border-green-100 opacity-60 hover:opacity-100 transition">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-500 line-through text-sm">{task.title}</p>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectBoard;