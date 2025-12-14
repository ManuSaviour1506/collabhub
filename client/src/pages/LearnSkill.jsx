import { useState } from 'react';
import api from '../services/api';

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
    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.post('/ai/roadmap', { skill }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoadmap(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Chat with AI
  const handleChat = async () => {
    if (!chatMessage) return;
    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory([...chatHistory, userMsg]);
    setChatMessage('');

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      const { data } = await api.post('/ai/chat', 
        { message: chatMessage, context: skill }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatHistory(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      
      {/* LEFT: Roadmap Generator */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-indigo-700">AI Learning Roadmap</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-4 text-gray-600">Enter a skill you want to master (e.g., "Python", "Digital Marketing").</p>
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              className="flex-1 border p-2 rounded"
              placeholder="Enter skill..."
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <button 
              onClick={handleGetRoadmap} 
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>

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
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {chatHistory.length === 0 && <p className="text-gray-400 text-center mt-10">Ask me anything about your learning journey!</p>}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-100 self-end ml-auto' : 'bg-gray-200 self-start'}`}>
              <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
            </div>
          ))}
        </div>

        <div className="p-4 border-t flex gap-2">
          <input 
            type="text" 
            className="flex-1 border p-2 rounded"
            placeholder="Ask a question..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
          />
          <button 
            onClick={handleChat}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
};

export default LearnSkill;