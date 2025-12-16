import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast'; // Used for notifications

const LearnSkill = () => {
  const [skill, setSkill] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Generate Roadmap
  const handleGetRoadmap = async (e) => {
    e.preventDefault();
    if (!skill) return;
    setLoading(true);
    setRoadmap(null); // Clear previous roadmap
    setChatHistory([]); // Clear chat for new skill context

    const toastId = toast.loading(`Generating roadmap for ${skill}...`);

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      // Call Node.js controller which uses Gemini API
      const { data } = await api.post('/ai/roadmap', { skill }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRoadmap(data);
      toast.success("Roadmap generated!", { id: toastId });
      
    } catch (error) {
      console.error("Roadmap Error:", error);
      toast.error(error.response?.data?.message || "Failed to generate roadmap. Try a simpler skill.", { id: toastId });
      
      // Fallback data structure from the Node controller error handling
      setRoadmap({
        title: `Roadmap for ${skill} (Offline Mode)`,
        steps: [
            { topic: "Basics", description: "Learn the core syntax and concepts." },
            { topic: "Intermediate Projects", description: "Build 3 small projects to practice." }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Chat with AI Tutor
  const handleChat = async () => {
    if (!chatMessage) return;

    const messageToSend = chatMessage;
    const userMsg = { role: 'user', content: messageToSend };
    
    // Optimistic update: Add user message immediately
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      // Call Node.js controller which uses Gemini API
      const { data } = await api.post('/ai/chat', 
        { message: messageToSend, context: skill || 'general skills' }, // Use current skill as context
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Add AI reply to history
      setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);
      
    } catch (error) {
      console.error("Chat Error:", error);
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: "I am having trouble connecting to the AI Tutor right now. Please try again later!" 
      }]);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* LEFT: Roadmap Generator */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-700">AI Learning Roadmap</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-4 text-gray-600">Enter a skill you want to master (e.g., "Python", "Digital Marketing").</p>
          <form onSubmit={handleGetRoadmap} className="flex gap-2 mb-6">
            <input 
              type="text" 
              className="flex-1 border p-2 rounded"
              placeholder="Enter skill..."
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </form>

          {roadmap && (
            <div className="border-l-4 border-indigo-500 pl-4 space-y-4">
              <h3 className="text-xl font-bold">{roadmap.title}</h3>
              {roadmap.steps.map((step, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded">
                  <span className="font-bold text-indigo-600">Step {idx + 1}: {step.topic}</span>
                  <p className="text-sm text-gray-700 mt-1">{step.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: AI Tutor Chat */}
      <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-100 p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Chat with AI Tutor</h2>
          <p className="text-sm text-gray-500">Context: {skill || 'General'}</p>
        </div>
        
        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatHistory.length === 0 && <p className="text-gray-400 text-center mt-10">Ask me anything about your learning journey!</p>}
          {chatHistory.map((msg, i) => (
            <div 
                key={i} 
                className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-md 
                    ${msg.role === 'user' 
                        ? 'bg-blue-600 text-white ml-auto rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'}`
                }
            >
              <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
            </div>
          ))}
          {/* Scroll Anchor, optional but good practice */}
          <div style={{ float:"left", clear: "both" }} /> 
        </div>

        {/* Input Area */}
        <div className="p-4 border-t flex gap-2">
          <input 
            type="text" 
            className="flex-1 border p-2 rounded-full px-4 focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Ask a question..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleChat(); }}
            disabled={loading}
          />
          <button 
            onClick={handleChat}
            disabled={loading || !chatMessage.trim()}
            className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
};

export default LearnSkill;