import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Default map center coordinates for Kathmandu, Nepal
const KATHMANDU_COORDINATES = { lat: 27.7172, lng: 85.3240 };

// Fix for Leaflet marker icon issue
// Import marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom component to update map view when coordinates change
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Custom component to handle marker events
function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);
  
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition({
          lat: newPos.lat,
          lng: newPos.lng
        });
      }
    },
  };

  return (
    <Marker 
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

const AddProperty = () => {
  const navigate = useNavigate();
  const { user, api, loading } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const searchInputRef = useRef(null);
  const [mapPosition, setMapPosition] = useState(KATHMANDU_COORDINATES);
  const [createdProperty, setCreatedProperty] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "house",
    status: "for-sale",
    price: "",
    location: {
      street: "",
      city: "Kathmandu",
      state: "",
      zipCode: "",
      coordinates: {
        latitude: KATHMANDU_COORDINATES.lat,
        longitude: KATHMANDU_COORDINATES.lng
      }
    },
    features: {
      bedrooms: "",
      bathrooms: "",
      area: "",
      yearBuilt: "",
      parking: false,
      furnished: false,
      airConditioning: false,
      swimmingPool: false,
      fireplace: false,
      laundry: false,
      gym: false,
      backyard: false,
      securitySystem: false,
      garage: false
    }
  });

  // Update formData coordinates when map position changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: {
          latitude: mapPosition.lat,
          longitude: mapPosition.lng
        }
      }
    }));
  }, [mapPosition]);

  // Setup geocoding with OpenStreetMap Nominatim
  const handleAddressSearch = async () => {
    if (!searchInputRef.current || !searchInputRef.current.value) return;
    
    try {
      const query = encodeURIComponent(searchInputRef.current.value);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPosition = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
        
        setMapPosition(newPosition);
        
        // Get address details
        const addressResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`);
        const addressData = await addressResponse.json();
        
        if (addressData && addressData.address) {
          const address = addressData.address;
          
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              street: [address.road, address.house_number].filter(Boolean).join(' ') || prev.location.street,
              city: address.city || address.town || address.village || prev.location.city,
              state: address.state || prev.location.state,
              zipCode: address.postcode || prev.location.zipCode,
              coordinates: {
                latitude: newPosition.lat,
                longitude: newPosition.lng
              }
            }
          }));
        }
      }
    } catch (err) {
      console.error("Error searching address:", err);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    const [parent, child] = name.split('.');
    
    setFormData({
      ...formData,
      [parent]: {
        ...formData[parent],
        [child]: checked
      }
    });
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    const numValue = value === "" ? "" : Number(value);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: numValue
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: numValue
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Preview images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviews]);
    
    // Store files for upload
    setImageFiles([...imageFiles, ...files]);
  };

  const removeImage = (index) => {
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.price || 
        !formData.location.street || !formData.location.city || 
        !formData.location.state || !formData.location.zipCode) {
      setError("Please fill in all required fields");
      return;
    }
    
    // Validate at least one image
    if (imageFiles.length === 0) {
      setError("Please upload at least one property image");
      return;
    }
    
    try {
      console.log("Starting property creation process...");
      
      // Create FormData object for file upload
      const propertyData = new FormData();
      
      // Explicitly stringify the title to ensure it's not empty
      propertyData.append('title', String(formData.title).trim());
      propertyData.append('description', String(formData.description).trim());
      propertyData.append('type', formData.type);
      propertyData.append('status', formData.status);
      propertyData.append('price', String(formData.price));
      
      // Add location data as flat key-value pairs
      propertyData.append('location.street', String(formData.location.street).trim());
      propertyData.append('location.city', String(formData.location.city).trim());
      propertyData.append('location.state', String(formData.location.state).trim());
      propertyData.append('location.zipCode', String(formData.location.zipCode).trim());
      
      // Add coordinates if they exist
      if (formData.location.coordinates.latitude && formData.location.coordinates.longitude) {
        propertyData.append('location.coordinates.latitude', String(formData.location.coordinates.latitude));
        propertyData.append('location.coordinates.longitude', String(formData.location.coordinates.longitude));
      }
      
      // Add features data as flat key-value pairs
      if (formData.features.bedrooms) propertyData.append('features.bedrooms', String(formData.features.bedrooms));
      if (formData.features.bathrooms) propertyData.append('features.bathrooms', String(formData.features.bathrooms));
      if (formData.features.area) propertyData.append('features.area', String(formData.features.area));
      if (formData.features.yearBuilt) propertyData.append('features.yearBuilt', String(formData.features.yearBuilt));
      
      // Boolean features
      propertyData.append('features.parking', String(formData.features.parking));
      propertyData.append('features.furnished', String(formData.features.furnished));
      propertyData.append('features.airConditioning', String(formData.features.airConditioning));
      propertyData.append('features.swimmingPool', String(formData.features.swimmingPool));
      propertyData.append('features.fireplace', String(formData.features.fireplace));
      propertyData.append('features.laundry', String(formData.features.laundry));
      propertyData.append('features.gym', String(formData.features.gym));
      propertyData.append('features.backyard', String(formData.features.backyard));
      propertyData.append('features.securitySystem', String(formData.features.securitySystem));
      propertyData.append('features.garage', String(formData.features.garage));
      
      // Add images - ensure proper file field name
      console.log('Image files to upload:', imageFiles.length);
      for (let i = 0; i < imageFiles.length; i++) {
        console.log(`Adding image ${i}:`, imageFiles[i].name, imageFiles[i].type, imageFiles[i].size);
        propertyData.append('propertyImages', imageFiles[i]);
      }

      console.log('Sending property data to API endpoint...');
      
      // Debug the form data being submitted
      console.log('Raw form data before FormData creation:', formData);
      console.log('Street value:', formData.location.street);
      
      for (let pair of propertyData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }
      
      console.log('Sending request to:', '/api/agent/properties');
      
      // Let the interceptor handle FormData properly
      const response = await api.post('/api/agent/properties', propertyData);

      console.log('Property created successfully with response:', response.data);
      setSuccess(true);
      setCreatedProperty(response.data);
    } catch (err) {
      console.error('Error creating property:', err);
      console.error('Response:', err.response);
      
      let errorMessage = 'Failed to create property. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Error details:', errorMessage);
      setError(errorMessage);
    }
  };

  if (!user || !user.isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Agent Access Only</h2>
          <p className="text-gray-600 mb-6">
            You need to be a registered agent to add properties. Please register as an agent first.
          </p>
          <button
            onClick={() => navigate('/joinagent')}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Register as Agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!user.isAgent ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center max-w-2xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Agent Registration Required</h2>
            <p className="text-gray-600 mb-6">
              You need to register as an agent to list properties on our platform. Please complete your agent registration.
            </p>
            <Link
              to="/agent-registration"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register as Agent
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Property</h1>
              <p className="text-gray-600 max-w-3xl">
                Complete the form below to list your new property. Fields marked with * are required.
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-800">There was an error processing your request.</p>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                  <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
                    <div>
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          Property Created Successfully!
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Your property has been added to the listings and is now visible to potential buyers.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                      <button
                        type="button"
                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                        onClick={() => navigate(`/properties/${createdProperty?._id}`)}
                      >
                        View Property
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Basic Information */}
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="title">
                          Property Title*
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="description">
                          Description*
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="propertyType">
                          Property Type*
                        </label>
                        <select
                          id="propertyType"
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        >
                          <option value="">Select Property Type</option>
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="condo">Condo</option>
                          <option value="townhouse">Townhouse</option>
                          <option value="land">Land</option>
                          <option value="commercial">Commercial</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="status">
                          Status*
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="for-sale">For Sale</option>
                          <option value="for-rent">For Rent</option>
                        </select>
                      </div>
                    </div>
                  </section>
                  
                  {/* Location */}
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Location</h2>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="locationSearch">
                        Search for address*
                      </label>
                      <div className="flex">
                        <input
                          ref={searchInputRef}
                          type="text"
                          id="locationSearch"
                          placeholder="Enter an address, city, or zip code"
                          className="w-full px-4 py-2 border border-gray-300 rounded-l-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleAddressSearch}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Search
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Using OpenStreetMap for address lookup. Search for a location or drag the marker on the map.
                      </p>
                    </div>
                    
                    <div className="h-64 w-full rounded-lg overflow-hidden shadow-md mb-4 z-0">
                      <MapContainer 
                        center={mapPosition} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DraggableMarker 
                          position={mapPosition}
                          setPosition={setMapPosition}
                        />
                        <MapUpdater center={mapPosition} />
                      </MapContainer>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="street">
                          Street
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="location.street"
                          value={formData.location.street}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="city">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="location.city"
                          value={formData.location.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="state">
                          State/Province
                        </label>
                        <input
                          type="text"
                          id="state"
                          name="location.state"
                          value={formData.location.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="zipCode">
                          Zip/Postal Code
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          name="location.zipCode"
                          value={formData.location.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="latitude">
                          Latitude
                        </label>
                        <input
                          type="text"
                          id="latitude"
                          value={formData.location.coordinates.latitude}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-gray-50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="longitude">
                          Longitude
                        </label>
                        <input
                          type="text"
                          id="longitude"
                          value={formData.location.coordinates.longitude}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-gray-50"
                        />
                      </div>
                    </div>
                  </section>
                  
                  {/* Property Details */}
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Property Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="price">
                          Price ($)*
                        </label>
                        <input
                          type="text"
                          id="price"
                          name="price"
                          value={formData.price}
                          onChange={handleNumberInput}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="bedrooms">
                          Bedrooms
                        </label>
                        <input
                          type="text"
                          id="bedrooms"
                          name="features.bedrooms"
                          value={formData.features.bedrooms}
                          onChange={handleNumberInput}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="bathrooms">
                          Bathrooms
                        </label>
                        <input
                          type="text"
                          id="bathrooms"
                          name="features.bathrooms"
                          value={formData.features.bathrooms}
                          onChange={handleNumberInput}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="area">
                          Square Feet
                        </label>
                        <input
                          type="text"
                          id="area"
                          name="features.area"
                          value={formData.features.area}
                          onChange={handleNumberInput}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="yearBuilt">
                          Year Built
                        </label>
                        <input
                          type="text"
                          id="yearBuilt"
                          name="features.yearBuilt"
                          value={formData.features.yearBuilt}
                          onChange={handleNumberInput}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Features */}
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Features & Amenities</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="parking"
                          name="features.parking"
                          checked={formData.features.parking}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="parking" className="ml-2 text-sm text-gray-700">
                          Parking
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="airConditioning"
                          name="features.airConditioning"
                          checked={formData.features.airConditioning}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="airConditioning" className="ml-2 text-sm text-gray-700">
                          Air Conditioning
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="swimmingPool"
                          name="features.swimmingPool"
                          checked={formData.features.swimmingPool}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="swimmingPool" className="ml-2 text-sm text-gray-700">
                          Swimming Pool
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="fireplace"
                          name="features.fireplace"
                          checked={formData.features.fireplace}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="fireplace" className="ml-2 text-sm text-gray-700">
                          Fireplace
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="laundry"
                          name="features.laundry"
                          checked={formData.features.laundry}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="laundry" className="ml-2 text-sm text-gray-700">
                          Laundry
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="gym"
                          name="features.gym"
                          checked={formData.features.gym}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="gym" className="ml-2 text-sm text-gray-700">
                          Gym
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="backyard"
                          name="features.backyard"
                          checked={formData.features.backyard}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="backyard" className="ml-2 text-sm text-gray-700">
                          Backyard
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="securitySystem"
                          name="features.securitySystem"
                          checked={formData.features.securitySystem}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="securitySystem" className="ml-2 text-sm text-gray-700">
                          Security System
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="garage"
                          name="features.garage"
                          checked={formData.features.garage}
                          onChange={handleCheckboxChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="garage" className="ml-2 text-sm text-gray-700">
                          Garage
                        </label>
                      </div>
                    </div>
                  </section>
                  
                  {/* Images */}
                  <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-800">Property Images</h2>
                    </div>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                        <input
                          type="file"
                          id="images"
                          name="images"
                          onChange={handleImageChange}
                          multiple
                          accept="image/*"
                          className="hidden"
                        />
                        <label
                          htmlFor="images"
                          className="cursor-pointer flex flex-col items-center justify-center"
                        >
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            ></path>
                          </svg>
                          <span className="mt-2 text-sm text-gray-600">Click to upload images</span>
                          <span className="mt-1 text-xs text-gray-500">
                            Support: JPG, JPEG, PNG (Max: 5MB each)
                          </span>
                        </label>
                      </div>

                      {previewUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                          {previewUrls.map((src, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={src}
                                alt={`Preview ${index + 1}`}
                                className="h-32 w-full object-cover rounded-lg shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
              
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center shadow-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Property...
                    </>
                  ) : (
                    "Create Property"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AddProperty; 