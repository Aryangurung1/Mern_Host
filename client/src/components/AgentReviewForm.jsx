import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AgentReviewForm = ({ agentId, onReviewSubmitted }) => {
  const { user, api } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post(`/api/agent/${agentId}/reviews`, {
        rating,
        comment
      });

      if (response.data) {
        toast.success('Review submitted successfully');
        setRating(0);
        setComment('');
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.error || 'Failed to submit review';
      toast.error(errorMessage, {
        duration: 4000 // Show the message for 4 seconds
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <div className="flex gap-1">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <button
                  type="button"
                  key={ratingValue}
                  className={`text-2xl focus:outline-none transition-colors ${
                    ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                >
                  <FaStar />
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <label 
            htmlFor="comment" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Review
          </label>
          <textarea
            id="comment"
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this agent..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !user}
          className={`w-full py-2 px-4 rounded-md text-white font-medium 
            ${isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>

        {!user && (
          <p className="mt-2 text-sm text-gray-500 text-center">
            Please login to submit a review
          </p>
        )}
      </form>
    </div>
  );
};

export default AgentReviewForm; 