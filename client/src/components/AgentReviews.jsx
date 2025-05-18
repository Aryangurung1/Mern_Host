import { FaStar, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AgentReviews = ({ reviews = [], onReviewDeleted }) => {
  const { user, api } = useAuth();
  
  const getPhotoUrl = (photo) => {
    if (!photo) return "https://via.placeholder.com/40";
    if (photo.startsWith('http')) return photo;
    return `${API_URL}${photo}`;
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const handleDeleteReview = async (agentId, reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await api.delete(`/api/agent/${agentId}/reviews/${reviewId}`);
      toast.success('Review deleted successfully');
      if (onReviewDeleted) {
        onReviewDeleted(reviewId);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-yellow-400">
            {calculateAverageRating()}
          </span>
          <div className="flex">
            {[...Array(5)].map((_, index) => (
              <FaStar
                key={index}
                className={`${
                  index < Math.round(calculateAverageRating())
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-gray-500">({reviews.length})</span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No reviews yet</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={getPhotoUrl(review.user?.photo)}
                    alt={review.user?.username}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/40";
                    }}
                  />
                  <div>
                    <h4 className="font-medium">{review.user?.username}</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, index) => (
                          <FaStar
                            key={index}
                            className={`${
                              index < review.rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            } text-sm`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                {user && user._id === review.user?._id && (
                  <button
                    onClick={() => handleDeleteReview(review.agent, review._id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete review"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-600 mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentReviews; 