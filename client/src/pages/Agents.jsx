import { useState, useEffect } from "react"
import { Search, User, Mail } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const AgentsPage = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroImages, setHeroImages] = useState([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    specialization: "All Specializations",
    experienceLevel: "Experience Level"
  });
  
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const [agentsResponse, propertiesResponse] = await Promise.all([
          api.get('/api/agent'),
          api.get('/api/properties', { params: { limit: 5, featured: true } })
        ]);
        
        console.log('Fetched agents:', agentsResponse.data);
        setAgents(agentsResponse.data);
        setFilteredAgents(agentsResponse.data);

        // Get hero images from featured properties instead of agents
        const images = propertiesResponse.data
          .filter(prop => prop.images && prop.images.length > 0)
          .map(prop => ({
            url: prop.images[0].url,
            title: prop.title,
            price: prop.price,
            id: prop._id
          }));
        setHeroImages(images);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAgents();
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
  
  // Effect to filter agents when search or filters change
  useEffect(() => {
    let result = [...agents];
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(agent => 
        (agent.username && agent.username.toLowerCase().includes(query)) ||
        (agent.agentRequest?.fullName && agent.agentRequest.fullName.toLowerCase().includes(query)) ||
        (agent.agentRequest?.city && agent.agentRequest.city.toLowerCase().includes(query)) ||
        (agent.agentRequest?.state && agent.agentRequest.state.toLowerCase().includes(query)) ||
        (agent.agentRequest?.specialization && agent.agentRequest.specialization.toLowerCase().includes(query))
      );
    }
    
    // Apply specialization filter
    if (filters.specialization !== "All Specializations") {
      result = result.filter(agent => 
        agent.agentRequest?.specialization?.toLowerCase() === filters.specialization.toLowerCase()
      );
    }
    
    // Apply experience level filter
    if (filters.experienceLevel !== "Experience Level") {
      const experienceYears = parseInt(filters.experienceLevel);
      result = result.filter(agent => {
        const experience = agent.agentRequest?.experience || 0;
        return experience >= experienceYears;
      });
    }
    
    setFilteredAgents(result);
  }, [agents, searchQuery, filters]);
  
  // Function to handle join as agent button click
  const handleJoinAgentClick = (e) => {
    e.preventDefault();
    if (user) {
      // If user is logged in, navigate directly to join agent page
      navigate('/joinagent');
    } else {
      // If user is not logged in, store the redirect URL and navigate to signin
      localStorage.setItem('redirectAfterLogin', '/joinagent');
      navigate('/signin');
    }
  };
  
  // Handle search input change
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchQuery(term);
    
    const filtered = agents.filter(agent => 
      (agent.username && agent.username.toLowerCase().includes(term)) ||
      (agent.agentRequest?.fullName && agent.agentRequest.fullName.toLowerCase().includes(term)) ||
      (agent.agentRequest?.specialization && agent.agentRequest.specialization.toLowerCase().includes(term))
    );
    
    setFilteredAgents(filtered);
  };
  
  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({
      specialization: "All Specializations",
      experienceLevel: "Experience Level"
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Image Carousel */}
      <section className="relative h-[600px]">
        {heroImages.length > 0 ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
              style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${API_URL}${heroImages[currentImageIndex].url}')`
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

            {/* Property Info */}
            <div className="absolute bottom-4 right-4 z-20">
              <Link 
                to={`/properties/${heroImages[currentImageIndex].id}`}
                className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-black text-sm px-3 py-1.5 rounded-full transition-all hover:scale-105 hover:shadow-lg"
              >
                <span>₹{heroImages[currentImageIndex].price?.toLocaleString('en-IN')}</span>
                <span>•</span>
                <span>{heroImages[currentImageIndex].title}</span>
              </Link>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center text-white">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                    Find Your Perfect Real Estate Agent
                  </h1>
                  <p className="text-lg md:text-xl mb-8 text-gray-100 drop-shadow-md">
                    Connect with experienced professionals who understand your needs
                  </p>

                  {/* Search Form */}
                  <div className="max-w-xl mx-auto">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name or specialization..."
                        className="w-full px-6 py-4 rounded-lg text-gray-800 bg-white/95 backdrop-blur-sm outline-none"
                        value={searchQuery}
                        onChange={handleSearch}
                      />
                      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
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

      {/* Filter Section */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-4">
            <select 
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
            >
              <option>All Specializations</option>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Luxury</option>
              <option>Investment</option>
            </select>

            <select 
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filters.experienceLevel}
              onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
            >
              <option>Experience Level</option>
              <option>1</option>
              <option>3</option>
              <option>5</option>
              <option>10</option>
            </select>
          </div>

          <button 
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>
      </section>

      {/* Agent Listings */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-100 p-4 rounded-lg inline-block">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No agents found matching your criteria</p>
              <div className="mt-4 space-x-4">
                <button 
                  onClick={handleClearFilters}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={handleJoinAgentClick}
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Become an Agent
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAgents.map(agent => (
                <Link
                  key={agent._id}
                  to={`/agent/${agent._id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={agent.agentRequest?.profilePhotoUrl 
                        ? (agent.agentRequest.profilePhotoUrl.startsWith('http')
                            ? agent.agentRequest.profilePhotoUrl
                            : `${API_URL}${agent.agentRequest.profilePhotoUrl}`)
                        : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                      alt={agent.agentRequest?.fullName || agent.username}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                    
                    {/* Agent Name and Quick View */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
                      <h3 className="text-white font-bold text-xl group-hover:text-indigo-200 transition-colors">
                        {agent.agentRequest?.fullName || agent.username}
                      </h3>
                      <span className="text-sm text-white/80 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        View Profile →
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-indigo-600 font-medium">
                        {agent.agentRequest?.specialization 
                          ? `${agent.agentRequest.specialization.charAt(0).toUpperCase() + agent.agentRequest.specialization.slice(1)} Specialist` 
                          : 'Real Estate Agent'}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600">
                      <span>{agent.agentRequest?.experience || 0}+ years exp.</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Become an Agent CTA */}
        <div className="max-w-6xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Are You a Real Estate Professional?</h2>
            <p className="text-gray-300 mb-6">Join our platform and connect with potential clients</p>
            <button 
              onClick={handleJoinAgentClick}
              className="bg-white text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Become an Agent
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgentsPage;
