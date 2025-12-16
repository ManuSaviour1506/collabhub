import { useState } from 'react';
import { StarIcon, XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '../../services/api';

const RatingModal = ({ ratedUserId, ratedUserName, onClose }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRating = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(`Submitting rating for ${ratedUserName}...`);

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      // Call the addRating endpoint
      await api.post('/ratings', { 
        ratedUserId, 
        rating: Number(rating), 
        review 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Rating submitted! They earned XP.", { id: toastId });
      onClose();

    } catch (error) {
      console.error("Rating Error:", error);
      const msg = error.response?.data?.message === "You have already rated this user" 
                  ? "You already rated this session." 
                  : "Rating failed. Try again.";
      toast.error(msg, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <XMarkIcon className="w-6 h-6" />
        </button>
        
        <h2 className="text-xl font-bold mb-2">Rate Your Peer</h2>
        <p className="text-gray-600 mb-6">How was your session with **{ratedUserName}**?</p>

        <form onSubmit={handleRating} className="space-y-4">
          
          {/* Star Rating Input */}
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <StarIcon
                key={star}
                onClick={() => setRating(star)}
                className={`w-8 h-8 cursor-pointer transition 
                  ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
              />
            ))}
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review (Optional)</label>
            <textarea
              rows="3"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your feedback..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Submitting...' : `Submit Rating (${rating} Stars)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;