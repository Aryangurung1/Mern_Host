import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function JoinAgent() {
  const { user, api, loading: authLoading, authInitialized } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    specialization: "",
    location: "",
    address: "",
    experience: "",
    citizenshipNo: "",
    profilePhoto: null,
    citizenshipPhoto: null,
    bio: "",
    agreeToTerms: false,
  });
  
  // Add preview states for photos
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [citizenshipPhotoPreview, setCitizenshipPhotoPreview] = useState(null);
  
  useEffect(() => {
    // Check authentication after initialization
    if (authInitialized && !authLoading) {
      if (!user) {
        navigate('/signin', { state: { from: '/join-agent' } });
        return;
      }
      
      // Redirect if user is already an agent
      if (user.isAgent) {
        navigate('/profile', { 
          state: { message: "You are already registered as an agent!" }
        });
        return;
      }
      
      // Set email from user object when available
      if (user.email && !formData.email) {
        setFormData(prev => ({
          ...prev,
          email: user.email,
          fullName: user.name || ""
        }));
      }
    }
  }, [user, authInitialized, authLoading, navigate, formData.email]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      // Add file to form data
      setFormData({
        ...formData,
        [name]: files[0],
      });
      
      // Create preview URL
      if (name === 'profilePhoto') {
        const previewUrl = URL.createObjectURL(files[0]);
        setProfilePhotoPreview(previewUrl);
      } else if (name === 'citizenshipPhoto') {
        const previewUrl = URL.createObjectURL(files[0]);
        setCitizenshipPhotoPreview(previewUrl);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData({
      ...formData,
      agreeToTerms: e.target.checked,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user) {
        throw new Error("Please sign in to register as an agent");
      }

      if (!formData.agreeToTerms) {
        throw new Error("You must agree to the terms and conditions");
      }

      // Validate required fields
      const requiredFields = ['fullName', 'email', 'phone', 'specialization', 'location', 'address', 'experience', 'citizenshipNo'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      }

      // Validate phone number to be 10 digits
      if (!/^\d{10}$/.test(formData.phone)) {
        throw new Error("Phone number must be exactly 10 digits");
      }

      // Validate file uploads
      if (!formData.profilePhoto || !formData.citizenshipPhoto) {
        throw new Error("Both profile photo and citizenship photo are required");
      }

      const data = new FormData();
      
      // Add all form fields to FormData
      for (const field of requiredFields) {
        data.append(field, formData[field]);
      }
      
      // Add optional fields
      if (formData.bio) {
        data.append('bio', formData.bio);
      }
      
      // Add files to FormData
      data.append('profilePhoto', formData.profilePhoto);
      data.append('citizenshipPhoto', formData.citizenshipPhoto);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Get auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error("Authentication token not found. Please sign in again.");
        }
        
        // Make the API request with the token explicitly included
        const response = await api.post("/api/agent/register", data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // Show success message
        setSuccess("You are now registered as an agent! You can start listing properties.");
        
        // Reset form after successful submission
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          specialization: "",
          location: "",
          address: "",
          experience: "",
          citizenshipNo: "",
          profilePhoto: null,
          citizenshipPhoto: null,
          bio: "",
          agreeToTerms: false,
        });
        
        // Redirect to agent dashboard after a short delay
        setTimeout(() => {
          navigate("/agent-dashboard", {
            state: { message: response.data.message || "Registration successful! Welcome to your agent dashboard." },
          });
        }, 2000);
      } catch (apiError) {
        console.error("API Error:", apiError);
        if (apiError.response?.status === 401) {
          setError("Authentication error: " + (apiError.response?.data?.message || "Please try refreshing the page"));
          // Attempt to refresh authentication by signing out and redirecting to sign in
          navigate('/signin', { state: { message: "Your session has expired. Please sign in again." }});
        } else if (apiError.response?.status === 400) {
          setError(apiError.response?.data?.message || "Please fill in all required fields");
        } else if (apiError.response?.status === 500) {
          setError("Server error. Please try again later.");
        } else if (apiError.name === 'AbortError') {
          setError("Request timed out. Please try again.");
        } else {
          setError(`Failed to register as agent: ${apiError.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error("Form Error:", error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
      if (citizenshipPhotoPreview) URL.revokeObjectURL(citizenshipPhotoPreview);
    };
  }, [profilePhotoPreview, citizenshipPhotoPreview]);

  // Render loading state if authentication is still initializing
  if (!authInitialized || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
          <h2 className="text-2xl font-semibold text-center mb-4">Loading...</h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-center mb-8">Become a Real Estate Agent</h2>
          
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

          {submitting && (
            <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
              Submitting your application...
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
              <div>
                <label htmlFor="citizenshipNo" className="block text-sm font-medium text-gray-700 mb-1">
                  Citizenship Number
                </label>
                <input
                  type="text"
                  id="citizenshipNo"
                  name="citizenshipNo"
                  value={formData.citizenshipNo}
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
                {profilePhotoPreview && (
                  <div className="mb-2 h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={profilePhotoPreview}
                      alt="Profile preview" 
                      className="h-full w-full object-cover"
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
                  required
                />
              </div>

              <div>
                <label htmlFor="citizenshipPhoto" className="block text-sm font-medium text-gray-700 mb-1">
                  Citizenship Photo
                </label>
                {citizenshipPhotoPreview && (
                  <div className="mb-2 h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={citizenshipPhotoPreview}
                      alt="Citizenship preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  id="citizenshipPhoto"
                  name="citizenshipPhoto"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                  I agree to the terms and conditions
                </label>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Register as Agent'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
