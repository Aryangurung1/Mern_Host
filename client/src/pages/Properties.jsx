import { useState, useEffect } from "react"
import { FaBed, FaBath, FaRulerCombined } from "react-icons/fa"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import PropertyCard from "../components/PropertyCard"

const Properties = () => {
  const [viewType, setViewType] = useState("grid")
  const [sortBy, setSortBy] = useState("default")
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priceMin: "",
    priceMax: "",
    propertyType: [],
    status: [],
    bedrooms: "Any",
    bathrooms: "Any",
    amenities: []
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/properties');
        setProperties(response.data || []);
        setFilteredProperties(response.data || []);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [api]);

  // Apply sorting to properties
  useEffect(() => {
    let sorted = [...filteredProperties];
    
    switch(sortBy) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "date":
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Keep default order
        break;
    }
    
    setFilteredProperties(sorted);
  }, [sortBy]);

  // Search and filter properties
  useEffect(() => {
    let result = [...properties];
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(property => 
        (property.title && property.title.toLowerCase().includes(query)) ||
        (property.description && property.description.toLowerCase().includes(query)) ||
        (property.location?.city && property.location.city.toLowerCase().includes(query)) ||
        (property.location?.state && property.location.state.toLowerCase().includes(query)) ||
        (property.location?.address && property.location.address.toLowerCase().includes(query)) ||
        ((property.propertyType || property.type) && (property.propertyType || property.type).toLowerCase().includes(query))
      );
    }
    
    // Apply price filter
    if (filters.priceMin) {
      result = result.filter(property => property.price >= parseFloat(filters.priceMin));
    }
    
    if (filters.priceMax) {
      result = result.filter(property => property.price <= parseFloat(filters.priceMax));
    }
    
    // Apply property type filter
    if (filters.propertyType.length > 0) {
      result = result.filter(property => {
        const propertyTypeValue = (property.propertyType || property.type || '').toLowerCase();
        return filters.propertyType.some(type => propertyTypeValue === type.toLowerCase());
      });
    }

    // Apply status filter
    if (filters.status.length > 0) {
      result = result.filter(property => {
        const propertyStatus = (property.status || '').toLowerCase();
        return filters.status.some(status => propertyStatus === status.toLowerCase());
      });
    }
    
    // Apply bedrooms filter
    if (filters.bedrooms !== "Any") {
      const bedroomCount = parseInt(filters.bedrooms, 10);
      if (filters.bedrooms.includes("+")) {
        // Handle "3+" case
        result = result.filter(property => 
          property.features.bedrooms >= bedroomCount
        );
      } else {
        // Exact match
        result = result.filter(property => 
          property.features.bedrooms === bedroomCount
        );
      }
    }
    
    // Apply bathrooms filter
    if (filters.bathrooms !== "Any") {
      const bathroomCount = parseInt(filters.bathrooms, 10);
      if (filters.bathrooms.includes("+")) {
        // Handle "3+" case
        result = result.filter(property => 
          property.features.bathrooms >= bathroomCount
        );
      } else {
        // Exact match
        result = result.filter(property => 
          property.features.bathrooms === bathroomCount
        );
      }
    }
    
    // Apply amenities filter
    if (filters.amenities.length > 0) {
      result = result.filter(property => {
        // Check if amenities are in property.features as boolean values
        if (property.features) {
          return filters.amenities.every(amenity => {
            // Convert display names to camelCase property keys
            let featureKey;
            switch(amenity) {
              case "Swimming Pool":
                featureKey = "swimmingPool";
                break;
              case "Air Conditioning":
                featureKey = "airConditioning";
                break;
              case "Security System":
                featureKey = "securitySystem";
                break;
              default:
                // Convert other amenities to camelCase
                featureKey = amenity.toLowerCase()
                  .replace(/\s+(.)/g, (match, group) => group.toUpperCase())
                  .replace(/\s+/g, '');
            }
            
            return property.features[featureKey] === true;
          });
        }
        
        // If amenities is a separate array property
        const propertyAmenities = property.amenities || [];
        if (Array.isArray(propertyAmenities) && propertyAmenities.length > 0) {
          return filters.amenities.every(amenity => 
            propertyAmenities.some(propAmenity => 
              propAmenity.toLowerCase().includes(amenity.toLowerCase())
            )
          );
        }
        
        // If amenities is an object with boolean values
        if (typeof property.amenities === 'object' && !Array.isArray(property.amenities)) {
          return filters.amenities.every(amenity => {
            const amenityKey = amenity.replace(/\s+/g, '').toLowerCase();
            return property.amenities[amenityKey] === true;
          });
        }
        
        // No matching amenities found
        return false;
      });
    }
    
    // Apply sorting
    switch(sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "date":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        // Keep default order
        break;
    }
    
    setFilteredProperties(result);
  }, [properties, searchQuery, filters, sortBy]);

  // Handle amenity checkbox change
  const handleAmenityChange = (amenity) => {
    setFilters(prev => {
      const updatedAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      
      return {
        ...prev,
        amenities: updatedAmenities
      };
    });
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The search is already applied via useEffect
  };

  // Handle bedroom button click
  const handleBedroomClick = (value) => {
    setFilters(prev => ({
      ...prev,
      bedrooms: value
    }));
  };

  // Handle bathroom button click
  const handleBathroomClick = (value) => {
    setFilters(prev => ({
      ...prev,
      bathrooms: value
    }));
  };

  // Handle price input change
  const handlePriceChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle apply filters button
  const handleApplyFilters = () => {
    // Filters are already applied via useEffect
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({
      priceMin: "",
      priceMax: "",
      propertyType: [],
      status: [],
      bedrooms: "Any",
      bathrooms: "Any",
      amenities: []
    });
  };

  // Mock data for display if API doesn't return properties
  const mockProperties = [
    {
      _id: "1",
      title: "Modern Family Home",
      price: 450000,
      propertyType: "House",
      location: {
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001"
      },
      features: {
        bedrooms: 3,
        bathrooms: 2,
        area: 2100,
        swimmingPool: true,
        garage: true,
        parking: true,
        airConditioning: true,
        laundry: false,
        securitySystem: false,
        fireplace: false,
        backyard: true,
        gym: false
      },
      status: "for-sale"
    },
    {
      _id: "2",
      title: "Downtown Apartment",
      price: 325000,
      propertyType: "Apartment",
      location: {
        address: "456 Park Ave",
        city: "Boston",
        state: "MA",
        zipCode: "02108"
      },
      features: {
        bedrooms: 2,
        bathrooms: 1,
        area: 1200,
        swimmingPool: false,
        garage: false, 
        parking: true,
        airConditioning: true,
        laundry: true,
        securitySystem: true,
        fireplace: false,
        backyard: false,
        gym: true
      },
      status: "for-rent"
    },
    {
      _id: "3",
      title: "Luxury Condo with View",
      price: 780000,
      propertyType: "Condo",
      location: {
        address: "789 Ocean Dr",
        city: "Miami",
        state: "FL",
        zipCode: "33139"
      },
      features: {
        bedrooms: 4,
        bathrooms: 3,
        area: 3200,
        swimmingPool: true,
        garage: true,
        parking: true,
        airConditioning: true,
        laundry: true,
        securitySystem: true,
        fireplace: true,
        backyard: true,
        gym: true
      },
      status: "for-sale"
    },
    {
      _id: "4",
      title: "Suburban Townhouse",
      price: 375000,
      propertyType: "Townhouse",
      location: {
        address: "101 Maple St",
        city: "Chicago",
        state: "IL",
        zipCode: "60007"
      },
      features: {
        bedrooms: 3,
        bathrooms: 2.5,
        area: 1800,
        swimmingPool: false,
        garage: true,
        parking: true,
        airConditioning: false,
        laundry: true,
        securitySystem: false,
        fireplace: true,
        backyard: true,
        gym: false
      },
      status: "for-sale"
    },
    {
      _id: "5",
      title: "Commercial Building",
      price: 1200000,
      propertyType: "Commercial",
      location: {
        address: "555 Business Rd",
        city: "Denver",
        state: "CO",
        zipCode: "80014"
      },
      features: {
        bedrooms: 0,
        bathrooms: 4,
        area: 5000,
        swimmingPool: false,
        garage: true,
        parking: true,
        airConditioning: true,
        laundry: false,
        securitySystem: true,
        fireplace: false,
        backyard: false,
        gym: false
      },
      status: "for-sale"
    },
    {
      _id: "6",
      title: "Empty Land for Development",
      price: 235000,
      propertyType: "Land",
      location: {
        address: "999 Rural St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94107"
      },
      features: {
        bedrooms: 0,
        bathrooms: 0,
        area: 10000,
        swimmingPool: false,
        garage: false,
        parking: false,
        airConditioning: false,
        laundry: false,
        securitySystem: false,
        fireplace: false,
        backyard: false,
        gym: false
      },
      status: "for-sale"
    }
  ];

  // Use real properties if available, otherwise use mock data
  const displayProperties = properties.length > 0 
    ? filteredProperties 
    : searchQuery || filters.priceMin || filters.priceMax || 
      filters.propertyType.length > 0 || filters.bedrooms !== "Any" || 
      filters.bathrooms !== "Any" || filters.amenities.length > 0
        ? mockProperties.filter(() => false) // No results if filtering with no real data
        : mockProperties; // Show all mock properties if no filters applied

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Properties</h1>
            <div className="flex items-center gap-4">
              {user?.isAgent && (
                <button
                  onClick={() => navigate("/add-property")}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Property
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewType("grid")}
                  className={`p-2 ${viewType === "grid" ? "text-indigo-600" : "text-gray-400"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewType("list")}
                  className={`p-2 ${viewType === "list" ? "text-indigo-600" : "text-gray-400"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="default">Sort by: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="date">Date Added</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Search by location, property type..."
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button type="submit" className="absolute inset-y-0 right-0 px-4 text-white bg-indigo-600 rounded-r-lg hover:bg-indigo-700 transition-colors">
                Search
              </button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="w-full md:w-96 bg-white p-8 rounded-xl shadow-sm h-fit">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Filters</h2>
                <button 
                  onClick={handleClearFilters}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                <div className="flex gap-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={filters.priceMin}
                    onChange={(e) => handlePriceChange('priceMin', e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                    value={filters.priceMax}
                    onChange={(e) => handlePriceChange('priceMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Property Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "house", label: "House", icon: "🏠" },
                    { id: "apartment", label: "Apartment", icon: "🏢" },
                    { id: "condo", label: "Condo", icon: "🏗️" },
                    { id: "townhouse", label: "Townhouse", icon: "🏘️" },
                    { id: "land", label: "Land", icon: "🌳" },
                    { id: "commercial", label: "Commercial", icon: "🏪" }
                  ].map(({ id, label, icon }) => (
                    <label 
                      key={id} 
                      className="flex items-center bg-gray-50 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 mr-2 h-4 w-4" 
                        checked={filters.propertyType.includes(id)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            propertyType: e.target.checked
                              ? [...prev.propertyType, id]
                              : prev.propertyType.filter(t => t !== id)
                          }));
                        }}
                      />
                      <span className="text-sm flex items-center gap-2">
                        <span className="text-base">{icon}</span>
                        <span className="truncate">{label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Property Status */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Property Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Sale Status */}
                  <select
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    value={filters.status.find(s => s === "for-sale" || s === "sold") || ""}
                    onChange={(e) => {
                      const newStatus = filters.status.filter(s => s !== "for-sale" && s !== "sold");
                      if (e.target.value) newStatus.push(e.target.value);
                      setFilters(prev => ({ ...prev, status: newStatus }));
                    }}
                  >
                    <option value="">Sale Status</option>
                    <option value="for-sale">For Sale</option>
                    <option value="sold">Sold</option>
                  </select>
                  
                  {/* Rent Status */}
                  <select
                    className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                    value={filters.status.find(s => s === "for-rent" || s === "rented") || ""}
                    onChange={(e) => {
                      const newStatus = filters.status.filter(s => s !== "for-rent" && s !== "rented");
                      if (e.target.value) newStatus.push(e.target.value);
                      setFilters(prev => ({ ...prev, status: newStatus }));
                    }}
                  >
                    <option value="">Rent Status</option>
                    <option value="for-rent">For Rent</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
              </div>

              {/* Bedrooms */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Bedrooms</h3>
                <div className="flex gap-2">
                  {["Any", "1", "2", "3+"].map((num) => (
                    <button
                      key={num}
                      className={`flex-1 py-2.5 text-sm border rounded-lg transition-colors ${
                        filters.bedrooms === num 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'hover:bg-gray-50 hover:border-indigo-600'
                      }`}
                      onClick={() => handleBedroomClick(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Bathrooms</h3>
                <div className="flex gap-2">
                  {["Any", "1", "2", "3+"].map((num) => (
                    <button
                      key={num}
                      className={`flex-1 py-2.5 text-sm border rounded-lg transition-colors ${
                        filters.bathrooms === num 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'hover:bg-gray-50 hover:border-indigo-600'
                      }`}
                      onClick={() => handleBathroomClick(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-3">Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "pool", label: "Swimming Pool" },
                    { id: "garage", label: "Garage" },
                    { id: "parking", label: "Parking" },
                    { id: "ac", label: "Air Conditioning" },
                    { id: "laundry", label: "Laundry" },
                    { id: "security", label: "Security System" },
                    { id: "fireplace", label: "Fireplace" },
                    { id: "backyard", label: "Backyard" },
                    { id: "gym", label: "Gym" }
                  ].map(({ id, label }) => (
                    <label 
                      key={id} 
                      className="flex items-center bg-gray-50 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 mr-2 h-4 w-4" 
                        checked={filters.amenities.includes(label)}
                        onChange={() => handleAmenityChange(label)}
                      />
                      <span className="text-sm truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleApplyFilters}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>

            {/* Property Grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                </div>
              ) : displayProperties.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search filters</p>
                  <button 
                    onClick={handleClearFilters}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div
                  className={`grid ${viewType === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6`}
                >
                  {/* Use PropertyCard component */}
                  {displayProperties.map((property) => (
                    <PropertyCard key={property._id} property={property} viewType={viewType} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {displayProperties.length > 0 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center gap-1">
                    <button className="px-3 py-1 border rounded hover:bg-gray-50">Previous</button>
                    {[1, 2, 3].map((page) => (
                      <button
                        key={page}
                        className={`px-3 py-1 border rounded ${
                          page === 1 ? "bg-indigo-600 text-white" : "hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Properties;

