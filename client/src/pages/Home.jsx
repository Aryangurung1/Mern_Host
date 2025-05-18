import { useState, useEffect } from "react";
import { FaBed, FaBath, FaRulerCombined, FaRegHeart, FaMapMarkerAlt, FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { API_URL } from "../config/api";

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

const HomePage = () => {
  const navigate = useNavigate();
  const { api } = useAuth();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapProperties, setMapProperties] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState([]);

  // Function to fetch featured properties
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch featured properties
        const propertiesRes = await api.get('/api/properties', {
          params: { limit: 6, featured: true }
        });
        setFeaturedProperties(propertiesRes.data || []);
        
        // Get hero images from featured properties
        const images = propertiesRes.data
          .filter(prop => prop.images && prop.images.length > 0)
          .map(prop => ({
            url: prop.images[0].url,
            title: prop.title,
            price: prop.price,
            id: prop._id
          }));
        setHeroImages(images);

        // Fetch top agents
        const agentsRes = await api.get('/api/agent', {
          params: { limit: 4, sort: 'rating' }
        });
        setTopAgents(agentsRes.data || []);
        
        // Get properties for map
        const allPropertiesRes = await api.get('/api/properties');
        const allProperties = allPropertiesRes.data || [];
        setMapProperties(allProperties.filter(p => 
          p.location && p.location.coordinates && 
          p.location.coordinates.latitude && 
          p.location.coordinates.longitude
        ).slice(0, 10));

      } catch (error) {
        console.error("Error fetching home page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  // Auto-advance carousel
  useEffect(() => {
    if (heroImages.length > 0) {
      const timer = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroImages.length]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  };

  // Helper function to get the correct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/placeholder.svg?height=250&width=400";
    return imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section with Property Images */}
      <section className="relative h-[600px]">
        {heroImages.length > 0 ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${API_URL}${heroImages[currentImageIndex].url}')`
              }}
            />
            
            {/* Navigation Arrows */}
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all z-20 group"
            >
              <FaChevronLeft size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all z-20 group"
            >
              <FaChevronRight size={20} className="group-hover:scale-110 transition-transform" />
            </button>

            {/* Compact Property Info */}
            <div className="absolute bottom-4 right-4 z-20">
              <Link 
                to={`/properties/${heroImages[currentImageIndex].id}`}
                className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-black text-sm px-3 py-1.5 rounded-full transition-all hover:scale-105 hover:shadow-lg"
              >
                View Details
                <FaArrowRight size={12} />
              </Link>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {heroImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-3' : 'bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center text-white">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                    Find Your Perfect Place to Call Home
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-gray-100 drop-shadow-md">
                    Discover exceptional properties tailored to your lifestyle
                  </p>
                  <Link 
                    to="/properties" 
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors text-lg font-medium"
                  >
                    Browse Properties
                    <FaArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        )}
      </section>

      {/* Featured Properties Section with Enhanced Hover Effects */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Featured Properties</h2>
              <div className="w-16 h-1 bg-indigo-600"></div>
            </div>
            <Link to="/properties" className="group flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
              View All
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : featuredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map(property => (
                <Link 
                  key={property._id}
                  to={`/properties/${property._id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={property.images?.[0]?.url ? `${API_URL}${property.images[0].url}` : '/placeholder.svg'}
                      alt={property.title}
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300"></div>
                    
                    {/* Status Badge */}
                    <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm font-medium text-white ${
                      property.status === 'for-sale' ? 'bg-green-500' : 
                      property.status === 'for-rent' ? 'bg-blue-500' : 
                      property.status === 'sold' ? 'bg-red-500' : 
                      property.status === 'rented' ? 'bg-purple-500' : 'bg-gray-500'
                    }`}>
                      {property.status === 'for-sale' ? 'For Sale' : 
                       property.status === 'for-rent' ? 'For Rent' : 
                       property.status === 'sold' ? 'Sold' : 
                       property.status === 'rented' ? 'Rented' : property.status}
                    </span>

                    {/* Quick View Button */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="bg-white/90 hover:bg-white text-black text-sm px-3 py-1.5 rounded-full transition-all">
                        View Details →
                      </span>
                </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{property.price?.toLocaleString('en-IN')}
                      </div>
                      <h3 className="text-xl font-medium mt-2 text-gray-800 group-hover:text-indigo-600 transition-colors">{property.title}</h3>
                      <p className="text-gray-500 mt-2 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-indigo-600" />
                        {property.location ? 
                          `${property.location.city || ''}, ${property.location.state || ''}` 
                          : 'Location not specified'}
                      </p>
                </div>

                    <div className="flex justify-between items-center py-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <FaBed className="text-indigo-600" />
                          <span>{property.features?.bedrooms || 0}</span>
                  </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <FaBath className="text-indigo-600" />
                          <span>{property.features?.bathrooms || 0}</span>
                  </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <FaRulerCombined className="text-indigo-600" />
                          <span>{property.features?.area || 0} sqft</span>
                </div>
              </div>
            </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No featured properties found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Top Rated Agents Section */}
      <section className="py-12 px-6 bg-gray-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Our Agents</h2>
              <div className="w-16 h-1 bg-indigo-600"></div>
            </div>
            <Link to="/agents" className="group flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
              View All
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : topAgents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {topAgents.map(agent => (
                <div key={agent._id} className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-8">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <img
                        src={getImageUrl(agent.agentRequest?.profilePhotoUrl)}
                        alt={agent.agentRequest?.fullName || agent.username}
                        className="w-full h-full rounded-full object-cover ring-4 ring-indigo-50"
                        onError={(e) => {
                          e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-bold text-center mb-2">{agent.agentRequest?.fullName || agent.username}</h3>
                    <p className="text-indigo-600 text-sm text-center mb-4">
                      {agent.agentRequest?.specialization 
                        ? `${agent.agentRequest.specialization.charAt(0).toUpperCase() + agent.agentRequest.specialization.slice(1)} Specialist` 
                        : 'Real Estate Agent'}
                    </p>
                    <Link to={`/agent/${agent._id}`}>
                      <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        View Profile
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No agents found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Map Section with Modern Design */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Explore Properties on Map</h2>
            <div className="w-20 h-1 bg-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-lg">Find properties in your desired location</p>
          </div>

          <div className="rounded-2xl overflow-hidden h-[600px] shadow-2xl">
            {mapProperties.length > 0 && mapProperties.some(p => 
              p.location?.coordinates?.latitude && 
              p.location?.coordinates?.longitude
            ) ? (
              <MapContainer
                center={[
                  parseFloat(mapProperties[0].location.coordinates.latitude),
                  parseFloat(mapProperties[0].location.coordinates.longitude)
                ]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {mapProperties.map(property => (
                  property.location?.coordinates?.latitude && 
                  property.location?.coordinates?.longitude && (
                    <Marker
                      key={property._id}
                      position={[
                        parseFloat(property.location.coordinates.latitude),
                        parseFloat(property.location.coordinates.longitude)
                      ]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                          <div className="text-xl font-bold text-indigo-600 mb-1">
                            ₹{property.price?.toLocaleString('en-IN')}
                          </div>
                          <p className="text-gray-600 mb-2">{property.propertyType}</p>
                          <Link 
                            to={`/properties/${property._id}`}
                            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg inline-block hover:bg-indigo-700 transition-colors"
                          >
                            View Details
                          </Link>
                  </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">No properties with location data available.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* More compact CTA Section */}
      <section className="py-12 px-6 bg-gradient-to-r from-indigo-600 to-indigo-800">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Home?</h2>
            <p className="text-lg mb-8 text-indigo-100">
              Join thousands of satisfied customers who found their perfect property through our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => navigate('/properties')}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
              >
                Browse Properties
              </button>
              <button 
                onClick={() => navigate('/agents')}
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-indigo-600 transition-colors"
              >
                Contact Agent
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

