import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Mail, Bed, Bath, Star, MapPin, Award, Clock, CheckCircle, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import ChatButton from "../components/chat/ChatButton";
import { FaStar, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import AgentReviewForm from '../components/AgentReviewForm';
import AgentReviews from '../components/AgentReviews';

export default function AgentProfile() {
  const { id } = useParams();
  const location = useLocation();
  const { api } = useAuth();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    satisfactionRate: 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    }
  });
  
  // Check if we're in the listings view
  const isListingsView = location.pathname.includes('/listings');
  
  // Calculate statistics from reviews
  const calculateStats = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        satisfactionRate: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    reviewsData.forEach(review => {
      totalRating += review.rating;
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    const averageRating = totalRating / reviewsData.length;
    // Calculate satisfaction rate (percentage of 4 and 5 star reviews)
    const satisfiedReviews = (distribution[4] || 0) + (distribution[5] || 0);
    const satisfactionRate = (satisfiedReviews / reviewsData.length) * 100;

    return {
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviewsData.length,
      satisfactionRate: Math.round(satisfactionRate),
      ratingDistribution: distribution
    };
  };
  
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate ID format first
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
          setError('Invalid agent ID format');
          setLoading(false);
          return;
        }

        console.log('Fetching agent data for ID:', id);
        const [agentRes, reviewsRes] = await Promise.all([
          api.get(`/api/agent/${id}`),
          api.get(`/api/agent/${id}/reviews`)
        ]);
        console.log('Agent data fetched:', agentRes.data);
        
        if (!agentRes.data) {
          throw new Error('No data received from server');
        }
        
        setAgent(agentRes.data);
        setReviews(reviewsRes.data);
        
        // Calculate and set statistics
        const newStats = calculateStats(reviewsRes.data);
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching agent data:', error);
        console.error('Error response:', error.response);
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          setError('Agent not found');
        } else if (error.response?.status === 403) {
          setError('This user is not an approved agent');
        } else if (error.response?.status === 400) {
          setError(error.response.data?.error || 'Invalid request');
        } else {
          setError(error.response?.data?.error || 'Failed to load agent profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAgentData();
    } else {
      setError('Agent ID not provided');
      setLoading(false);
    }
  }, [id, api]);

  const handleReviewSubmitted = (newReview) => {
    setReviews(prevReviews => {
      const updatedReviews = [newReview, ...prevReviews];
      const newStats = calculateStats(updatedReviews);
      setStats(newStats);
      return updatedReviews;
    });
  };

  // Render star rating component
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // Render rating bar component
  const renderRatingBar = (rating, count) => {
    const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
    return (
      <div key={`rating-${rating}`} className="flex items-center gap-2 text-sm">
        <span className="w-12">{rating} stars</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="w-12 text-right">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-700">Agent not found</p>
        </div>
      </div>
    );
  }

  // Extract agent data
  const fullName = agent.agentRequest?.fullName || agent.username;
  const experience = agent.agentRequest?.experience || 0;
  const agentLocation = agent.agentRequest?.location || "Not specified";
  const specialization = agent.agentRequest?.specialization || "Real Estate";
  const bio = agent.agentRequest?.bio || `${fullName} is a professional real estate agent specializing in ${specialization} properties with ${experience} years of experience in ${agentLocation}.`;
  const propertiesCount = agent.properties?.length || 0;

  // Render Properties Section
  const renderPropertiesSection = () => {
    if (isListingsView) {
      return (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">All Listings by {fullName}</h2>
            <Link
              to={`/agent/${agent._id}`}
              className="text-sm flex items-center gap-1 hover:text-gray-600"
            >
              Back to Profile
              <span className="ml-1">←</span>
            </Link>
          </div>

          {agent.properties && agent.properties.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {agent.properties.map(property => (
                <Link 
                  to={`/properties/${property._id}`} 
                  key={property._id} 
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="relative">
                    <img
                      src={property.images?.[0]?.url 
                        ? (property.images[0].url.startsWith('http') 
                            ? property.images[0].url 
                            : `${API_URL}${property.images[0].url}`)
                        : "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg"}
                      alt={property.title}
                      className="h-52 w-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-sm font-semibold py-1 px-3 m-2 rounded">
                      {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || "Property"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {property.location ? 
                        `${property.location.city}, ${property.location.state}` 
                        : "Location not specified"}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="font-bold text-xl">₹{property.price ? property.price.toLocaleString() : "Price on request"}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />{property.features?.bedrooms || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          {property.features?.bathrooms || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No properties listed yet</p>
              <p className="text-sm text-gray-400">This agent hasn't added any properties to their portfolio.</p>
            </div>
          )}
        </div>
      );
    } else {
      // Regular profile view with preview of properties
      return (
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Current Listings</h2>
            <Link
              to={`/agent/${agent._id}/listings`}
              className="text-sm flex items-center gap-1 hover:text-gray-600"
            >
              View All
              <span className="ml-1">→</span>
            </Link>
          </div>

          {agent.properties && agent.properties.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {agent.properties.slice(0, 3).map(property => (
                <Link 
                  to={`/properties/${property._id}`} 
                  key={property._id} 
                  className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="relative">
                    <img
                      src={property.images?.[0]?.url 
                        ? (property.images[0].url.startsWith('http') 
                            ? property.images[0].url 
                            : `${API_URL}${property.images[0].url}`)
                        : "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg"}
                      alt={property.title}
                      className="h-52 w-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg";
                      }}
                    />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-60 text-white text-sm font-semibold py-1 px-3 m-2 rounded">
                      {property.type?.charAt(0).toUpperCase() + property.type?.slice(1) || "Property"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {property.location ? 
                        `${property.location.city}, ${property.location.state}` 
                        : "Location not specified"}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="font-bold text-xl">₹{property.price ? property.price.toLocaleString() : "Price on request"}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />{property.features?.bedrooms || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          {property.features?.bathrooms || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No properties listed yet</p>
              <p className="text-sm text-gray-400">This agent hasn't added any properties to their portfolio.</p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Only show the profile header and information in the regular profile view */}
          {!isListingsView && (
            <>
              {/* Agent Profile Header */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className="w-48 h-48 mx-auto md:mx-0 rounded-lg overflow-hidden border-4 border-white shadow-lg">
                      <img
                        src={agent.agentRequest?.profilePhotoUrl 
                          ? (agent.agentRequest.profilePhotoUrl.startsWith('http')
                              ? agent.agentRequest.profilePhotoUrl
                              : `${API_URL}${agent.agentRequest.profilePhotoUrl}`)
                          : "https://ui-avatars.com/api/?name=" + encodeURIComponent(fullName) + "&background=random"}
                        alt={fullName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error('Error loading agent photo:', e);
                          e.target.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(fullName) + "&background=random";
                        }}
                      />
                    </div>
                  </div>

                  <div className="md:w-2/3">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h1 className="text-3xl font-bold mb-1">{fullName}</h1>
                        <p className="text-gray-600 mb-2">{specialization} Specialist</p>
                        <div className="flex items-center gap-2 mb-4">
                          {renderStars(stats.averageRating)}
                          <span className="text-lg font-semibold text-gray-700">{stats.averageRating}</span>
                          <span className="text-sm text-gray-500">({stats.totalReviews} reviews)</span>
                        </div>
                      </div>
                      <ChatButton agentId={id} agentName={fullName} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mt-6 bg-gray-50 rounded-lg p-4">
                      <div className="text-center p-4">
                        <p className="text-2xl font-bold mb-1">{experience}+</p>
                        <p className="text-sm text-gray-600">Years Experience</p>
                      </div>
                      <div className="text-center p-4">
                        <p className="text-2xl font-bold mb-1">{stats.satisfactionRate}%</p>
                        <p className="text-sm text-gray-600">Client Satisfaction</p>
                      </div>
                      <div className="text-center p-4">
                        <p className="text-2xl font-bold mb-1">{propertiesCount}</p>
                        <p className="text-sm text-gray-600">Active Listings</p>
                      </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-3">Rating Distribution</h3>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => (
                          renderRatingBar(rating, stats.ratingDistribution[rating])
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="px-6 md:px-8 pb-8">
                  <h2 className="text-xl font-bold mb-4">About Me</h2>
                  <p className="text-gray-700 leading-relaxed">
                    {bio}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Properties Section - conditionally rendered based on the route */}
          {renderPropertiesSection()}

          {/* Only show these sections in the regular profile view */}
          {!isListingsView && (
            <>
              {/* Review Form Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Write a Review</h2>
                <AgentReviewForm agentId={id} onReviewSubmitted={handleReviewSubmitted} />
              </div>

              {/* Reviews Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-6">Client Reviews ({reviews.length})</h2>
                {reviews.length > 0 ? (
                  <AgentReviews 
                    reviews={reviews} 
                    onReviewDeleted={(reviewId) => {
                      setReviews(prevReviews => {
                        const updatedReviews = prevReviews.filter(r => r._id !== reviewId);
                        const newStats = calculateStats(updatedReviews);
                        setStats(newStats);
                        return updatedReviews;
                      });
                    }}
                  />
                ) : (
                  <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                    <p className="text-gray-500">No reviews yet. Be the first to review {fullName}!</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}