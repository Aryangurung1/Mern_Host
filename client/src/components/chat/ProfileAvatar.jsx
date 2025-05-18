import React from 'react';
import { API_URL } from '../../config/api';

/**
 * A simplified component to display a profile avatar
 * Directly renders the image without state management for better performance
 */
const ProfileAvatar = ({ user, username = 'User', className = 'w-10 h-10 rounded-full object-cover' }) => {
  // Function to get the correct photo URL
  const getPhotoUrl = () => {
    // Default photo URL
    const defaultPhoto = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    
    if (!user) return defaultPhoto;
    
    // For agents with agentRequest
    if (user.agentRequest?.profilePhotoUrl) {
      return user.agentRequest.profilePhotoUrl.startsWith('http')
        ? user.agentRequest.profilePhotoUrl
        : `${API_URL}${user.agentRequest.profilePhotoUrl}`;
    }
    
    // For users with photo
    if (user.photo) {
      return user.photo.startsWith('http') ? user.photo : `${API_URL}${user.photo}`;
    }
    
    return defaultPhoto;
  };

  // Get display name for alt text
  const getDisplayName = () => {
    if (!user) return username;
    return user.agentRequest?.fullName || user.username || username;
  };

  return (
    <img
      src={getPhotoUrl()}
      alt={getDisplayName()}
      className={className}
      onError={(e) => {
        console.error('Error loading profile photo');
        e.target.src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
      }}
    />
  );
};

export default ProfileAvatar;
