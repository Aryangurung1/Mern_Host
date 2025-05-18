import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaBed, FaBath, FaRulerCombined, FaParking, FaMapMarkerAlt, FaCalendarAlt, FaHome, FaTag, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { toast } from "react-toastify";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { api, user } = useAuth();
  const [property, setProperty] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agent, setAgent] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  const apiBaseUrl = 'http://localhost:5008';

  const fetchProperty = async () => {
    setLoading(true);
    setError(null);
    setActiveImage(0); // Reset active image when fetching new data
    
    try {
      const response = await api.get(`/api/properties/${id}`);
      
      const propertyData = {
        ...response.data,
        images: response.data.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${apiBaseUrl}${img.url}`
        }))
      };
      setProperty(propertyData);
      
      // Process agent data if available
      if (response.data.agent) {
        const agentData = response.data.agent;
        setAgent(agentData);
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProperties = async () => {
    try {
      setLoadingSimilar(true);
      // Fetch properties with similar type or price range
      const response = await api.get('/api/properties', {
        params: {
          limit: 3,
          exclude: id,
          type: property?.type,
          minPrice: property?.price * 0.7, // 70% of current property price
          maxPrice: property?.price * 1.3, // 130% of current property price
        }
      });
      setSimilarProperties(response.data || []);
    } catch (error) {
      console.error('Error fetching similar properties:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
    
    // Cleanup function to reset states when component unmounts
    return () => {
      setProperty(null);
      setAgent(null);
      setActiveImage(0);
      setError(null);
      setSimilarProperties([]);
    };
  }, [id, location.key]); // Dependencies include id and location.key to refresh on navigation

  useEffect(() => {
    if (property) {
      fetchSimilarProperties();
    }
  }, [property]);

  const handleEdit = () => {
    navigate(`/properties/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        // Use the agent-specific endpoint if the user is the agent who created the property
        if (user?.isAgent && property.agent._id === user._id) {
          console.log(`Deleting agent property with ID ${id}`);
          await api.delete(`/api/agent/properties/${id}`);
        } else {
          console.log(`Deleting regular property with ID ${id}`);
          await api.delete(`/api/properties/${id}`);
        }
        
        toast.success('Property deleted successfully');
        navigate('/properties');
      } catch (error) {
        console.error('Error deleting property:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete property. Please try again.';
        toast.error(errorMessage);
        setLoading(false);
      }
    }
  };

  // Check if the current user is the agent who listed this property
  const isListingAgent = user?.isAgent && agent?._id === user?._id;

  // Add a new function to handle status updates
  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      
      // Only allow status updates for agents who own the property
      if (!isListingAgent) {
        toast.error('Only the listing agent can update the property status');
        setLoading(false);
        return;
      }
      
      const statusUpdate = {
        status: newStatus
      };
      
      await api.put(`/api/agent/properties/${id}`, statusUpdate);
      
      toast.success(`Property marked as ${statusText[newStatus]}`);
      // Refresh the property data
      fetchProperty();
    } catch (error) {
      console.error('Error updating property status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update property status. Please try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Determine the next status based on current status
  const getNextStatus = (currentStatus) => {
    switch(currentStatus) {
      case 'for-sale': return 'sold';
      case 'for-rent': return 'rented';
      case 'sold': return 'for-sale';
      case 'rented': return 'for-rent';
      default: return 'for-sale';
    }
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

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-700">Property not found</p>
        </div>
      </div>
    );
  }

  // Use the actual property data instead of mock data
  const propertyData = {
    ...property,
    images: property.images && property.images.length > 0 ? property.images : [
      { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", caption: "Front View" }
    ],
    features: property.features || {
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      yearBuilt: 0,
      parking: false,
      furnished: false
    }
  };

  const statusColors = {
    'for-sale': 'bg-green-500',
    'for-rent': 'bg-blue-500',
    'sold': 'bg-red-500',
    'rented': 'bg-purple-500'
  };

  const statusText = {
    'for-sale': 'For Sale',
    'for-rent': 'For Rent',
    'sold': 'Sold',
    'rented': 'Rented'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-black">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/properties" className="hover:text-black">Properties</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium truncate">{propertyData.title}</span>
          </div>
          {isListingAgent && (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaEdit className="w-4 h-4" />
                Edit Property
              </button>
              <button
                onClick={() => handleStatusUpdate(getNextStatus(propertyData.status))}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                  propertyData.status === 'for-sale' || propertyData.status === 'for-rent' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <FaTag className="w-4 h-4" />
                Mark as {statusText[getNextStatus(propertyData.status)]}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-lg mb-8">
          {/* Property Images Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="md:col-span-2">
              <div className="relative h-96 rounded-lg overflow-hidden">
                <img 
                  src={propertyData.images[activeImage]?.url || "https://cdn.pixabay.com/photo/2016/11/18/17/46/house-1836070_1280.jpg"} 
                  alt={propertyData.images[activeImage]?.caption || propertyData.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`${statusColors[propertyData.status]} px-3 py-1 rounded-full text-white text-sm font-medium`}>
                    {statusText[propertyData.status]}
                  </span>
                </div>
              </div>
              <div className="flex mt-2 space-x-2 overflow-x-auto pb-2">
                {propertyData.images.map((image, index) => (
                  <div 
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`cursor-pointer h-20 w-20 rounded-md overflow-hidden flex-shrink-0 transition-all border-2 ${activeImage === index ? 'border-indigo-500' : 'border-transparent'}`}
                  >
                    <img 
                      src={image.url} 
                      alt={image.caption || `Image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-1 flex flex-col">
              <div className="bg-gray-50 rounded-lg p-6 flex-grow">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{propertyData.title}</h1>
                <div className="flex items-center mb-4">
                  <FaMapMarkerAlt className="text-gray-400 mr-2" />
                  <p className="text-gray-600">
                    {property.location ? 
                      `${property.location.street}, ${property.location.city}, ${property.location.state} ${property.location.zipCode}` 
                      : "Location not specified"}
                  </p>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  ₹{propertyData.price?.toLocaleString('en-IN')}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center">
                    <FaBed className="text-gray-400 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Bedrooms</p>
                      <p className="font-semibold">{propertyData.features.bedrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaBath className="text-gray-400 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Bathrooms</p>
                      <p className="font-semibold">{propertyData.features.bathrooms}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaRulerCombined className="text-gray-400 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Area</p>
                      <p className="font-semibold">{propertyData.features.area} sq ft</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaHome className="text-gray-400 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="font-semibold capitalize">{propertyData.type}</p>
                    </div>
                  </div>
                </div>
                
                {agent && (
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold mb-2">Listed by:</h3>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                        <img 
                          src={agent.agentRequest?.profilePhotoUrl ? `${apiBaseUrl}${agent.agentRequest.profilePhotoUrl}` : "/placeholder.svg?height=48&width=48"}
                          alt={agent.fullName || agent.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{agent.fullName || agent.username}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                    <Link to={`/agent/${agent._id}`}>
                      <button className="mt-3 w-full bg-white border border-black text-black py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        Contact Agent
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Property Details Sections */}
          <div className="p-6 border-t border-gray-100">
            <h2 className="text-xl font-bold mb-4">About This Property</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {propertyData.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Property Type</span>
                    <span className="font-medium capitalize">{propertyData.type}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Year Built</span>
                    <span className="font-medium">{propertyData.features.yearBuilt}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium capitalize">{statusText[propertyData.status]}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Parking</span>
                    <span className="font-medium">{propertyData.features.parking ? 'Yes' : 'No'}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray-500">Furnished</span>
                    <span className="font-medium">{propertyData.features.furnished ? 'Yes' : 'No'}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Features & Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(propertyData.features)
                    .filter(([, value]) => typeof value === 'boolean')
                    .map(([feature, isPresent]) => {
                      // Convert camelCase to Title Case (e.g., airConditioning -> Air Conditioning)
                      const formattedFeature = feature
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());

                      return isPresent ? (
                        <div key={feature} className="flex items-center">
                          <svg 
                            className="h-5 w-5 text-green-500 mr-2" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{formattedFeature}</span>
                        </div>
                      ) : null;
                    })}
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Location</h3>
              <div className="h-96 rounded-lg overflow-hidden">
                {property?.location?.coordinates ? (
                  <MapContainer
                    center={[
                      parseFloat(property.location.coordinates.latitude),
                      parseFloat(property.location.coordinates.longitude)
                    ]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={[
                        parseFloat(property.location.coordinates.latitude),
                        parseFloat(property.location.coordinates.longitude)
                      ]}
                    >
                      <Popup>
                        {property.title}
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
                    <div className="text-center">
                      <FaMapMarkerAlt className="text-4xl inline-block mb-2" />
                      <p>Location coordinates not available</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm mt-2 text-gray-500">
                {property?.location ? 
                  `${property.location.street}, ${property.location.city}, ${property.location.state} ${property.location.zipCode}`
                  : "Location not specified"}
              </p>
            </div>
          </div>
          
          {/* Footer section with property metadata */}
          <div className="bg-gray-50 p-4 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap justify-between items-center">
            <div className="flex items-center">
              <FaCalendarAlt className="mr-1" />
              <span>Listed on: {new Date(propertyData.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <FaTag className="mr-1" />
              <span>Property ID: {id}</span>
            </div>
            {propertyData.verified && (
              <div className="flex items-center text-green-600">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Verified Listing</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Similar Properties Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Similar Properties</h2>
          {loadingSimilar ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : similarProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((similarProperty) => (
                <div key={similarProperty._id} className="bg-white rounded-lg overflow-hidden shadow-md">
                  <div className="relative">
                    <img
                      src={similarProperty.images?.[0]?.url.startsWith('http') 
                        ? similarProperty.images[0].url 
                        : `${apiBaseUrl}${similarProperty.images[0].url}`}
                      alt={similarProperty.title}
                      className="w-full h-48 object-cover"
                    />
                    <span className={`absolute top-4 right-4 ${statusColors[similarProperty.status]} text-white px-2 py-1 rounded text-sm`}>
                      {statusText[similarProperty.status]}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xl font-bold text-gray-900">₹{similarProperty.price?.toLocaleString('en-IN')}</span>
                        <h3 className="text-lg font-medium mt-1">{similarProperty.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {similarProperty.location.street}, {similarProperty.location.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-gray-500 text-sm">
                        <FaBed className="mr-1" />
                        <span>{similarProperty.features?.bedrooms || 'N/A'} Beds</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <FaBath className="mr-1" />
                        <span>{similarProperty.features?.bathrooms || 'N/A'} Baths</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm">
                        <FaRulerCombined className="mr-1" />
                        <span>{similarProperty.features?.area || 'N/A'} sqft</span>
                      </div>
                    </div>
                    <Link to={`/properties/${similarProperty._id}`}>
                      <button className="w-full mt-4 bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <FaHome className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No similar properties found</p>
              <p className="text-sm text-gray-400">We couldn't find any properties matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail; 