import { useState, useEffect } from 'react';
import { House, Users, FileText, MessageSquare, Settings, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function AgentDashboard() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [agentProfile, setAgentProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('properties');

  // Fetch agent profile and properties on mount
  useEffect(() => {
    if (!user?.isAgent) {
      navigate('/profile');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, propertiesRes] = await Promise.all([
          api.get('/api/agent/profile'),
          api.get('/api/agent/properties')
        ]);

        console.log("Agent profile data:", profileRes.data);
        console.log("Agent properties:", propertiesRes.data);

        setAgentProfile(profileRes.data);
        setProperties(propertiesRes.data);
      } catch (err) {
        console.error("Error fetching agent data:", err);
        setError("Failed to load your agent profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, api, navigate]);

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Function to handle property status update
  const handleStatusUpdate = async (propertyId, currentStatus) => {
    try {
      // Determine the next status based on current status
      let newStatus;
      switch(currentStatus) {
        case 'for-sale': newStatus = 'sold'; break;
        case 'for-rent': newStatus = 'rented'; break;
        case 'sold': newStatus = 'for-sale'; break;
        case 'rented': newStatus = 'for-rent'; break;
        default: newStatus = 'for-sale';
      }
      
      // Update the property status
      await api.put(`/api/agent/properties/${propertyId}`, { status: newStatus });
      
      // Show success message
      toast.success(`Property marked as ${newStatus === 'for-sale' ? 'For Sale' : 
                                         newStatus === 'for-rent' ? 'For Rent' : 
                                         newStatus === 'sold' ? 'Sold' : 'Rented'}`);
      
      // Refresh the properties data
      const response = await api.get('/api/agent/properties');
      setProperties(response.data);
    } catch (error) {
      console.error('Error updating property status:', error);
      toast.error(error.response?.data?.message || 'Failed to update property status');
    }
  };

  // Helper function to get status button text
  const getStatusButtonText = (status) => {
    switch(status) {
      case 'for-sale': return 'Mark Sold';
      case 'for-rent': return 'Mark Rented';
      case 'sold': return 'List For Sale';
      case 'rented': return 'List For Rent';
      default: return 'Change Status';
    }
  };

  // Helper function to get status button color
  const getStatusButtonClass = (status) => {
    switch(status) {
      case 'for-sale': 
      case 'for-rent': 
        return 'bg-green-600 hover:bg-green-700';
      case 'sold': 
      case 'rented': 
        return 'bg-purple-600 hover:bg-purple-700';
      default: 
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="container mx-auto bg-red-100 p-4 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agent Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {agentProfile?.username || user?.username}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => navigate('/edit-agent-profile')}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-all"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Agent Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <House className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Properties</div>
              <div className="text-xl font-bold">{properties?.length || 0}</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Inquiries</div>
              <div className="text-xl font-bold">0</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Messages</div>
              <div className="text-xl font-bold">0</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Experience</div>
              <div className="text-xl font-bold">{agentProfile?.agentRequest?.experience || 0} Years</div>
            </div>
          </div>
        </div>

        {/* Agent Profile Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <img 
                src={
                  agentProfile?.agentRequest?.profilePhotoUrl 
                    ? `http://localhost:5008${agentProfile.agentRequest.profilePhotoUrl}`
                    : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                }
                alt="Agent Profile" 
                className="h-48 w-48 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                }}
              />
              <h3 className="text-lg font-medium">{agentProfile?.agentRequest?.fullName || agentProfile?.username}</h3>
              <p className="text-gray-500 text-sm">{agentProfile?.agentRequest?.specialization || ""} Specialist</p>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{agentProfile?.agentRequest?.email || agentProfile?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{agentProfile?.agentRequest?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{agentProfile?.agentRequest?.location || "—"}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{agentProfile?.agentRequest?.address || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Bio</p>
                <p className="font-medium">{agentProfile?.agentRequest?.bio || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => handleTabClick('properties')}
              className={`pb-4 font-medium text-sm ${
                activeTab === 'properties'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Properties
            </button>
            <button
              onClick={() => handleTabClick('inquiries')}
              className={`pb-4 font-medium text-sm ${
                activeTab === 'inquiries'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inquiries
            </button>
            <button
              onClick={() => handleTabClick('messages')}
              className={`pb-4 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Messages
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'properties' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">My Properties</h2>
              <button
                onClick={() => navigate('/add-property')}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add New Property
              </button>
            </div>

            {properties.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500 mb-4">You don't have any properties listed yet.</p>
                <button
                  onClick={() => navigate('/add-property')}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property._id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={property.images?.[0]?.url 
                          ? (property.images[0].url.startsWith('http') 
                              ? property.images[0].url 
                              : `${import.meta.env.VITE_API_URL}${property.images[0].url}`)
                          : "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg"}
                        alt={property.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg";
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {property.status === 'for-sale' ? 'For Sale' : 
                         property.status === 'for-rent' ? 'For Rent' : 
                         property.status === 'sold' ? 'Sold' : 
                         property.status === 'rented' ? 'Rented' : 'For Sale'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{property.title}</h3>
                      <p className="text-gray-500 text-sm mb-3">{property.location?.address || `${property.location?.city}, ${property.location?.state}` || "Location not specified"}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                          {property.features?.bedrooms || 0} Beds
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {property.features?.bathrooms || 0} Baths
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                            />
                          </svg>
                          {property.features?.area || 0} sqft
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold">${property.price?.toLocaleString()}</div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleStatusUpdate(property._id, property.status)}
                            className={`px-3 py-1 text-white rounded text-sm ${getStatusButtonClass(property.status)}`}
                          >
                            {getStatusButtonText(property.status)}
                          </button>
                          <button 
                            onClick={() => navigate(`/properties/${property._id}/edit`)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => navigate(`/properties/${property._id}`)}
                            className="px-3 py-1 bg-black text-white rounded text-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'inquiries' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">No inquiries yet.</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 