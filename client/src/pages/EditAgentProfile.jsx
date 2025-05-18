import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_URL } from '../config/api';

export default function EditAgentProfile() {
  const { user, api, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    location: "",
    address: "",
    experience: "",
    bio: "",
    profilePhoto: null,
    citizenshipPhoto: null,
  });

  // Add state for profile photo preview
  const [photoPreview, setPhotoPreview] = useState(null);

  // Load agent data on mount
  useEffect(() => {
    if (!user || !user.isAgent) {
      navigate('/profile');
      return;
    }

    console.log("User data in EditAgentProfile:", JSON.stringify(user, null, 2));
    console.log("Agent data:", user.agentRequest);

    // Populate form with existing agent data
    if (user.agentRequest) {
      setFormData({
        fullName: user.agentRequest.fullName || "",
        email: user.agentRequest.email || user.email || "",
        phone: user.agentRequest.phone || "",
        specialization: user.agentRequest.specialization || "",
        location: user.agentRequest.location || "",
        address: user.agentRequest.address || "",
        experience: user.agentRequest.experience || "",
        bio: user.agentRequest.bio || "",
        profilePhoto: null,
        citizenshipPhoto: null,
      });
    } else {
      console.error("No agent data found in user object");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      // For file input
      setFormData({
        ...formData,
        [name]: files[0]
      });
      
      // Create preview URL
      if (name === 'profilePhoto') {
        const previewUrl = URL.createObjectURL(files[0]);
        setPhotoPreview(previewUrl);
      }
    } else {
      // For all other inputs
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      if (!user || !user.isAgent) {
        throw new Error("You must be a verified agent to update your profile");
      }

      // Validate required fields
      const requiredFields = ['fullName', 'email', 'phone', 'specialization', 'location', 'address', 'experience'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      const data = new FormData();
      // Add all form fields to FormData
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });

      console.log('Form data being submitted:');
      for (let [key, value] of data.entries()) {
        console.log(key, value);
      }

      try {
        const response = await api.put("/api/agent/profile", data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

        console.log("Profile update successful:", response.data);
        setSuccess("Profile updated successfully!");
        
        // Update user context with new data
        if (response.data.user) {
          setUser(response.data.user);
        }
      } catch (apiError) {
        console.error("API Error:", apiError.response?.data || apiError);
        
        if (apiError.response?.status === 401) {
          setError("Your session has expired. Please sign in again.");
          localStorage.removeItem('authToken');
          navigate('/signin', { replace: true });
        } else if (apiError.response?.status === 400) {
          setError(apiError.response?.data?.message || "Please fill in all required fields");
        } else {
          setError("Failed to update profile. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup function for preview URL
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  if (!user || !user.isAgent) {
    return null; // Let the useEffect redirect handle this
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">Edit Agent Profile</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <select
                  id="specialization"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select specialization</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="luxury">Luxury</option>
                  <option value="investment">Investment</option>
                  <option value="land">Land</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                  <option value="retail">Retail</option>
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Experience (years)
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="profilePhoto" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo
                </label>
                {photoPreview ? (
                  <div className="mb-2 h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={photoPreview}
                      alt="Profile preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : user.agentRequest?.profilePhotoUrl && (
                  <div className="mb-2 h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={`${API_URL}${user.agentRequest.profilePhotoUrl}`}
                      alt="Current Profile" 
                      className="h-full w-full object-cover"
                      onError={(e) => e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                    />
                  </div>
                )}
                <input
                  type="file"
                  id="profilePhoto"
                  name="profilePhoto"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current photo</p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-40 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 