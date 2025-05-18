import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCloudUploadAlt, FaTrash, FaBed, FaBath, FaRulerCombined } from "react-icons/fa";

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentListings, setCurrentListings] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    yearBuilt: '',
    lotSize: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: '',
    longitude: '',
    features: {
      parking: false,
      airConditioning: false,
      swimmingPool: false,
      fireplace: false,
      laundry: false,
      gym: false,
      backyard: false,
      securitySystem: false,
      garage: false,
    },
    status: 'for-sale'
  });

  const [images, setImages] = useState([]);
  const fileInputRef = useRef();

  // Debug log for authentication state
  useEffect(() => {
    console.log('Auth state:', {
      isAuthenticated: !!user,
      userId: user?._id,
      isAgent: user?.isAgent,
      token: localStorage.getItem('authToken')
    });
  }, [user]);

  // Fetch current listings
  useEffect(() => {
    const fetchCurrentListings = async () => {
      try {
        // Only attempt to fetch if we have a user and they're an agent
        if (!user?._id) {
          console.log('User not logged in');
          setError('Please log in to view your listings');
          navigate('/signin');
          return;
        }

        if (!user?.isAgent) {
          console.log('User is not an agent');
          setError('Only agents can view listings');
          navigate('/joinagent');
          return;
        }

        const token = localStorage.getItem('authToken');
        console.log('Auth Debug:', {
          userId: user._id,
          isAgent: user.isAgent,
          hasToken: !!token,
          tokenStart: token ? token.substring(0, 20) : 'no token',
          apiBaseUrl: import.meta.env.VITE_API_URL
        });

        const response = await api.get('/api/agent/properties', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('API Response:', response.data);
        setCurrentListings(response.data);
      } catch (error) {
        console.error('Error fetching current listings:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config,
          headers: error.config?.headers
        });
        if (error.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          navigate('/signin');
        } else if (error.response?.status === 403) {
          setError('You are not authorized to view these listings');
          navigate('/joinagent');
        } else {
          setError(error.response?.data?.message || 'Failed to fetch current listings');
        }
      }
    };

    fetchCurrentListings();
  }, [api, user, navigate]);

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First verify if user is logged in and is an agent
        if (!user?._id) {
          setError("You must be logged in to edit properties");
          navigate('/signin');
          return;
        }

        if (!user?.isAgent) {
          setError("You must be an agent to edit properties");
          navigate('/joinagent');
          return;
        }
        
        const response = await api.get(`/api/properties/${id}`);
        const propertyData = response.data;

        // Verify if the current user is the agent who listed this property
        if (propertyData.agent._id !== user._id) {
          setError("You don't have permission to edit this property");
          navigate('/properties');
          return;
        }

        // Map the property data to form fields
        setFormData({
          title: propertyData.title || '',
          description: propertyData.description || '',
          type: propertyData.type || '',
          price: propertyData.price || '',
          bedrooms: propertyData.features?.bedrooms || '',
          bathrooms: propertyData.features?.bathrooms || '',
          squareFeet: propertyData.features?.area || '',
          yearBuilt: propertyData.features?.yearBuilt || '',
          lotSize: propertyData.features?.area || '',
          street: propertyData.location?.street || '',
          city: propertyData.location?.city || '',
          state: propertyData.location?.state || '',
          zipCode: propertyData.location?.zipCode || '',
          latitude: propertyData.location?.coordinates?.latitude || '',
          longitude: propertyData.location?.coordinates?.longitude || '',
          status: propertyData.status || 'for-sale',
          features: {
            parking: propertyData.features?.parking || false,
            airConditioning: propertyData.features?.airConditioning || false,
            swimmingPool: propertyData.features?.swimmingPool || false,
            fireplace: propertyData.features?.fireplace || false,
            laundry: propertyData.features?.laundry || false,
            gym: propertyData.features?.gym || false,
            backyard: propertyData.features?.backyard || false,
            securitySystem: propertyData.features?.securitySystem || false,
            garage: propertyData.features?.garage || false,
          }
        });

        // Handle images
        if (propertyData.images && propertyData.images.length > 0) {
          setImages(propertyData.images.map(img => ({
            _id: img._id,
            url: img.url,
            isExisting: true
          })));
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setError(error.response?.data?.message || 'Failed to fetch property details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id, api, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : type === 'number' ? Number(value) || '' : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) || '' : value
      }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = new FormData();
      
      // Append basic fields
      const basicFields = ['title', 'description', 'type', 'price', 'status'];
      basicFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== '') {
          data.append(field, formData[field].toString());
        }
      });

      // Append location data
      const location = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        coordinates: {
          latitude: formData.latitude,
          longitude: formData.longitude
        }
      };
      data.append('location', JSON.stringify(location));

      // Append features
      const features = {
        ...formData.features,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        area: parseInt(formData.squareFeet) || 0,
        yearBuilt: parseInt(formData.yearBuilt) || 0
      };
      data.append('features', JSON.stringify(features));

      // Handle existing images
      const existingImageIds = images
        .filter(img => img.isExisting)
        .map(img => img._id);
      data.append('existingImages', JSON.stringify(existingImageIds));

      // Append new images
      const newImages = images.filter(img => img.isNew);
      newImages.forEach(image => {
        if (image.file) {
          data.append('images', image.file);
        }
      });

      // Log the FormData contents for debugging
      for (let pair of data.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Make the API call with the auth token
      const token = localStorage.getItem('authToken');
      const response = await api.put(`/api/agent/properties/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.status === 200) {
        setSuccess(true);
        // Wait for 2 seconds to show the success message before redirecting
        setTimeout(() => {
          navigate(`/properties/${id}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating property:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update property. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (loading && !success) {
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-green-100 p-6 rounded-lg text-center">
          <svg 
            className="w-16 h-16 text-green-500 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Property Updated Successfully!</h2>
          <p className="text-green-600">Redirecting to property details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Current Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentListings.map((property) => (
              <div key={property._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={property.images[0]?.url.startsWith('http') 
                      ? property.images[0].url 
                      : `${import.meta.env.VITE_API_URL}${property.images[0]?.url}`}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium
                      ${property.status === 'for-sale' ? 'bg-green-500' : 
                        property.status === 'for-rent' ? 'bg-blue-500' : 
                        property.status === 'sold' ? 'bg-red-500' : 'bg-purple-500'}`}>
                      {property.status === 'for-sale' ? 'For Sale' : 
                       property.status === 'for-rent' ? 'For Rent' : 
                       property.status === 'sold' ? 'Sold' : 'Rented'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
                  <p className="text-gray-600 mb-2">{property.location.city}, {property.location.state}</p>
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    ${property.price.toLocaleString()}
                  </div>
                  <div className="flex justify-between text-gray-500 mb-4">
                    <div className="flex items-center">
                      <FaBed className="mr-2" />
                      <span>{property.features.bedrooms} beds</span>
                    </div>
                    <div className="flex items-center">
                      <FaBath className="mr-2" />
                      <span>{property.features.bathrooms} baths</span>
                    </div>
                    <div className="flex items-center">
                      <FaRulerCombined className="mr-2" />
                      <span>{property.features.area} sqft</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to={`/properties/${property._id}/edit`}
                      className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    <Link 
                      to={`/properties/${property._id}`}
                      className="flex-1 text-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-8">Edit Property</h1>
        
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md"
                  >
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Street</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Latitude</label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Longitude</label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Features</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Square Feet</label>
                <input
                  type="number"
                  name="squareFeet"
                  value={formData.squareFeet}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Year Built</label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md"
                  required
                />
              </div>

              <div className="col-span-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.parking"
                    checked={formData.features.parking}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Parking Available</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.airConditioning"
                    checked={formData.features.airConditioning}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Air Conditioning</span>
                </label>
              </div>

              <div className="col-span-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.swimmingPool"
                    checked={formData.features.swimmingPool}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Swimming Pool</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.fireplace"
                    checked={formData.features.fireplace}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Fireplace</span>
                </label>
              </div>

              <div className="col-span-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.laundry"
                    checked={formData.features.laundry}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Laundry</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.gym"
                    checked={formData.features.gym}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Gym</span>
                </label>
              </div>

              <div className="col-span-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.backyard"
                    checked={formData.features.backyard}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Backyard</span>
                </label>

                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.securitySystem"
                    checked={formData.features.securitySystem}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Security System</span>
                </label>
              </div>

              <div className="col-span-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="features.garage"
                    checked={formData.features.garage}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2">Garage</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Property Images</h2>
            
            {/* Existing Images */}
            {images.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Current Images</h3>
                <div className="grid grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={image._id} className="relative">
                      <img
                        src={image.url.startsWith('http') ? image.url : `${import.meta.env.VITE_API_URL}${image.url}`}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Images */}
            <div>
              <h3 className="text-lg font-medium mb-2">Add New Images</h3>
              <div className="grid grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview}
                      alt={`New upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
                >
                  <FaCloudUploadAlt className="w-8 h-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Click to upload</span>
                </div>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 justify-end mt-6">
            <button
              type="button"
              onClick={() => navigate(`/properties/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;