import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user._id}`);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    }
  }, [user]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (user && wishlist.length > 0) {
      localStorage.setItem(`wishlist_${user._id}`, JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  // Add property to wishlist
  const addToWishlist = (property) => {
    if (!user) return;
    setWishlist(prev => {
      if (!prev.some(item => item._id === property._id)) {
        return [...prev, property];
      }
      return prev;
    });
  };

  // Remove property from wishlist
  const removeFromWishlist = (propertyId) => {
    if (!user) return;
    setWishlist(prev => prev.filter(item => item._id !== propertyId));
  };

  // Check if a property is in the wishlist
  const isInWishlist = (propertyId) => {
    return wishlist.some(item => item._id === propertyId);
  };

  // Get wishlist count
  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getWishlistCount
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
} 