import { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api'; // Import api for fetching quiz data
import confetti from 'canvas-confetti';

const QuizModal = ({ quizData: { skill }, onClose, onFinish }) => {
  // State for the quiz flow
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Quiz Data on Mount
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!skill) return onClose();
      setLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        // API call to the backend AI/quiz endpoint
        const { data } = await api.post('/ai/quiz', { skill }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Data format: [{ question, options, correctAnswer (index) }]
        // The ML Engine returns 'a' for correctAnswer
        const formattedData = data.map(q => ({
          q: q.question,
          options: q.options,
          a: q.correctAnswer,
          // Add difficulty if you want to display it
        }));

        setQuestions(formattedData);
        setLoading(false);
      } catch (error) {
        console.error("Quiz Fetch Error:", error);
        toast.error("AI is busy or questions missing. Try again.");
        onClose();
      }
    };
    fetchQuiz();
  }, [skill, onClose]);


  const totalQuestions = questions.length;

  // Handlers
  const handleAnswer = (optionIndex) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQ < totalQuestions - 1) {
      setCurrentQ(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (totalQuestions === 0) return;
    if (Object.keys(selectedAnswers).length < totalQuestions) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    let correctCount = 0;
    questions.forEach((q, index) => {
      // q.a is the correct answer index (from the ML engine output)
      if (selectedAnswers[index] === q.a) { 
        correctCount++;
      }
    });

    setScore(correctCount);
    setIsSubmitted(true);
    
    if (correctCount >= Math.ceil(totalQuestions / 2)) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    
    if (onFinish) {
        onFinish(correctCount, totalQuestions); // Pass results back to Profile.jsx
    }
    toast.success(`Quiz completed! You scored ${correctCount} out of ${totalQuestions}.`, { icon: '🏆' });
  };
  
  // Helper functions for styling
  const isOptionSelected = (index) => selectedAnswers[currentQ] === index;
  
  const getOptionClass = (optionIndex, correctAnswerIndex) => {
    if (!isSubmitted) {
        // Not submitted: only highlight current selection
        return isOptionSelected(optionIndex) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50';
    }

    // Submitted: show result
    const isCorrect = optionIndex === correctAnswerIndex;
    const isUserSelection = isOptionSelected(optionIndex);

    if (isCorrect) {
        return 'bg-green-100 border-green-500 text-green-700 font-bold';
    }
    if (isUserSelection && !isCorrect) {
        return 'bg-red-100 border-red-500 text-red-700 line-through';
    }
    return 'border-gray-200 opacity-60';
  };

  // --- Main Render ---
  if (loading) return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 text-white">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🤖</div>
        <p>Gemini AI is generating a unique {skill} test...</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
        
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {isSubmitted ? `Quiz Results: ${score}/${totalQuestions}` : `Skill Assessment Quiz (${currentQ + 1} of ${totalQuestions})`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px] flex flex-col justify-between">
          
          {totalQuestions > 0 ? (
            <div className="flex-grow space-y-6">
              
              {/* Question Title */}
              <p className="font-semibold text-xl text-gray-900">
                {questions[currentQ].q}
              </p>
              
              {/* Options List */}
              <div className="space-y-3">
                
                {questions[currentQ]?.options?.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-4 border rounded-xl transition flex justify-between items-center 
                            ${getOptionClass(index, questions[currentQ].a)}`}
                    >
                        <span>{option}</span>
                        {isSubmitted && index === questions[currentQ].a && <CheckCircleIcon className="w-5 h-5 text-green-600" />}
                        {isSubmitted && isOptionSelected(index) && index !== questions[currentQ].a && <XMarkIcon className="w-5 h-5 text-red-600" />}
                    </button>
                ))}
              </div>

            </div>
          ) : (
            // Fallback for when data is not ready (prevents the crash)
            <div className="text-center py-10 flex-grow flex flex-col items-center justify-center">
              <p className="text-gray-500 font-medium text-lg">No questions found for {skill}.</p>
              <p className="text-sm text-gray-400 mt-2">Make sure your skill is correctly seeded in the database.</p>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-white p-6 border-t flex justify-between items-center">
            
            {/* Navigation Buttons */}
            <div>
                <button 
                    onClick={handlePrev} 
                    disabled={currentQ === 0 || isSubmitted || totalQuestions === 0}
                    className="p-2 mr-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleNext} 
                    disabled={currentQ === totalQuestions - 1 || isSubmitted || totalQuestions === 0}
                    className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
            
            {/* Submit/Results Button */}
            <div>
                {isSubmitted ? (
                    <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                        Close & Continue
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmit} 
                        disabled={Object.keys(selectedAnswers).length < totalQuestions || totalQuestions === 0}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400 transition"
                    >
                        Submit Quiz
                    </button>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default QuizModal;