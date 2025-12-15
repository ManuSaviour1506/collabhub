import { useState, useEffect } from 'react';
import api from '../../services/api';
import confetti from 'canvas-confetti'; // Run: npm install canvas-confetti

const QuizModal = ({ skill, onClose, onVerified }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.post('/ai/quiz', { skill }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQuestions(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        alert("AI is busy. Try again.");
        onClose();
      }
    };
    fetchQuiz();
  }, [skill]);

  const handleAnswer = (optionIndex) => {
    if (optionIndex === questions[currentQ].correctAnswer) {
      setScore(prev => prev + 1);
    }

    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setFinished(true);
    // Determine if passed (e.g., need 4/5)
    // In a real app, calculate final score logic here
    if (score >= 3) { // Let's be lenient for demo: 3/5 passes
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (onVerified) onVerified();
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 text-white">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🤖</div>
        <p>Gemini AI is generating a unique {skill} test...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-lg w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>

        {!finished ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Verify: {skill}</h2>
              <span className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                Q{currentQ + 1}/{questions.length}
              </span>
            </div>

            <p className="text-lg mb-6 font-medium">{questions[currentQ].question}</p>

            <div className="space-y-3">
              {questions[currentQ].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full text-left p-4 border rounded hover:bg-indigo-50 hover:border-indigo-500 transition"
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <h2 className="text-3xl font-bold mb-4">{score >= 3 ? '🎉 Verified!' : '😢 Failed'}</h2>
            <p className="text-gray-600 mb-6">
              You scored {score}/{questions.length}. 
              {score >= 3 ? ' You have earned the Verified badge!' : ' Review your notes and try again.'}
            </p>
            <button 
              onClick={onClose}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizModal;