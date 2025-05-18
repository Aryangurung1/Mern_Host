import React from 'react';
import { Link } from 'react-router-dom';
import { FaBed, FaBath, FaRulerCombined } from 'react-icons/fa';
import { Heart } from 'lucide-react';
import { API_URL } from '../config/api';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PropertyCard = ({ property }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  const handleWishlistToggle = (e) => {
    e.preventDefault(); // Prevent navigation to property details
    
    if (!user) {
      toast.error('Please sign in to add properties to your wishlist');
      return;
    }

    if (isInWishlist(property._id)) {
      removeFromWishlist(property._id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(property);
      toast.success('Added to wishlist');
    }
  };

  return (
    <Link to={`/properties/${property._id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02]">
        <div className="relative">
          <img
            src={property.images?.[0]?.url ? `${API_URL}${property.images[0].url}` : '/placeholder.jpg'}
            alt={property.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-full ${
                isInWishlist(property._id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-gray-600 hover:text-red-500'
              } transition-colors shadow-md`}
            >
              <Heart className="w-5 h-5" fill={isInWishlist(property._id) ? "currentColor" : "none"} />
            </button>
            <span className={`px-2 py-1 rounded text-sm font-semibold ${
              property.status === 'For Sale' ? 'bg-green-500' : 'bg-blue-500'
            } text-white`}>
              {property.status}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{property.title}</h3>
          <p className="text-gray-600 mb-2 line-clamp-2">{property.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold">
              ₹{property.price?.toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-gray-500">
            <div className="flex items-center">
              <FaBed className="mr-2" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center">
              <FaBath className="mr-2" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center">
              <FaRulerCombined className="mr-2" />
              <span>{property.size} sqft</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard; 