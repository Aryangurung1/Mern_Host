import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, Home, Building, Users, Heart, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../config/api";
import { Link } from 'react-router-dom';
import { useWishlist } from "../context/WishlistContext";
import { useState } from "react";

const Header = () => {
  const { user, signout } = useAuth();
  const { wishlist, getWishlistCount, removeFromWishlist } = useWishlist();
  const navigate = useNavigate();
  const [showWishlist, setShowWishlist] = useState(false);

  // Debug user photo info
  if (user) {
    console.log('User in Header:', {
      username: user.username,
      photo: user.photo,
      isAgent: user.isAgent,
      agentPhotoUrl: user.isAgent ? user.agentRequest?.profilePhotoUrl : null
    });
  }

  const handleLogout = async () => {
    try {
      await signout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    if (user?.isAdmin) {
      navigate('/admin/dashboard');
    } else {
      navigate('/profile');
    }
  };

  const getUserPhotoUrl = () => {
    console.log('User photo data:', {
      photo: user?.photo,
      agentPhoto: user?.isAgent ? user?.agentRequest?.profilePhotoUrl : null
    });

    const cleanPhotoPath = (path) => {
      // If it's already a full URL, return it as is
      if (path.startsWith('http')) {
        return path;
      }
      // Remove any leading slashes and 'uploads' from the path
      const cleanPath = path.replace(/^\/*(uploads\/)*/, '');
      // Construct URL with correct path (/uploads/ instead of /api/uploads/)
      return `${API_URL}/uploads/${cleanPath}`;
    };

    if (user?.photo) {
      return cleanPhotoPath(user.photo);
    }
    
    if (user?.isAgent && user.agentRequest?.profilePhotoUrl) {
      return cleanPhotoPath(user.agentRequest.profilePhotoUrl);
    }
    
    // Return default avatar if no photo is available
    return 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  };

  return (
    <header className="bg-white border-b shadow-sm transition-all duration-200 hover:shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-3xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
              Gharelu
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center space-x-2 transition-all duration-200 ${
                  isActive 
                    ? 'text-indigo-600 font-medium' 
                    : 'text-gray-600 hover:text-indigo-600 hover:scale-105'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>
            <NavLink 
              to="/properties" 
              className={({ isActive }) => 
                `flex items-center space-x-2 transition-all duration-200 ${
                  isActive 
                    ? 'text-indigo-600 font-medium' 
                    : 'text-gray-600 hover:text-indigo-600 hover:scale-105'
                }`
              }
            >
              <Building className="w-5 h-5" />
              <span>Properties</span>
            </NavLink>
            <NavLink 
              to="/agents" 
              className={({ isActive }) => 
                `flex items-center space-x-2 transition-all duration-200 ${
                  isActive 
                    ? 'text-indigo-600 font-medium' 
                    : 'text-gray-600 hover:text-indigo-600 hover:scale-105'
                }`
              }
            >
              <Users className="w-5 h-5" />
              <span>Agents</span>
            </NavLink>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setShowWishlist(!showWishlist)}
                    className={`flex items-center space-x-2 transition-all duration-200 relative ${
                      showWishlist 
                        ? 'text-indigo-600 font-medium' 
                        : 'text-gray-600 hover:text-indigo-600 hover:scale-105'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    {getWishlistCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getWishlistCount()}
                      </span>
                    )}
                  </button>

                  {/* Wishlist Dropdown */}
                  {showWishlist && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-800">My Wishlist</h3>
                          <button
                            onClick={() => setShowWishlist(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {wishlist.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-gray-500">Your wishlist is empty</p>
                          <button
                            onClick={() => {
                              setShowWishlist(false);
                              navigate('/properties');
                            }}
                            className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Browse Properties
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {wishlist.map((property) => (
                            <div key={property._id} className="p-4 hover:bg-gray-50">
                              <div className="flex space-x-4">
                                <img
                                  src={property.images?.[0]?.url ? `${API_URL}${property.images[0].url}` : '/placeholder.jpg'}
                                  alt={property.title}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                  <Link
                                    to={`/properties/${property._id}`}
                                    onClick={() => setShowWishlist(false)}
                                    className="text-gray-800 font-medium hover:text-indigo-600"
                                  >
                                    {property.title}
                                  </Link>
                                  <p className="text-indigo-600 font-bold">
                                    ${property.price?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                  </p>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <span>{property.bedrooms} beds</span>
                                    <span className="mx-2">•</span>
                                    <span>{property.bathrooms} baths</span>
                                    <span className="mx-2">•</span>
                                    <span>{property.size} sqft</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFromWishlist(property._id)}
                                  className="text-gray-400 hover:text-red-500"
                                  title="Remove from wishlist"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 transition-all duration-200 hover:scale-105"
                >
                  {getUserPhotoUrl() ? (
                    <img
                      src={getUserPhotoUrl()}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 hover:border-indigo-400 transition-colors"
                      onError={(e) => {
                        console.error('Failed to load image:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-indigo-400 transition-colors flex items-center justify-center bg-gray-100">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <span className="font-medium">{user.username}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-all duration-200 hover:scale-105"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <NavLink
                  to="/signin"
                  className="text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:scale-105"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 hover:scale-105 hover:shadow-md"
                >
                  Sign Up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;