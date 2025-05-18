/**
 * Get the profile photo URL for a user or agent
 * This is a simplified version that always returns the default avatar
 * for consistency and to ensure images always display
 * @returns {string} - The profile photo URL
 */
export const getProfilePhotoUrl = () => {
  // Always return the default photo for consistency
  return "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
};

/**
 * Create a profile photo component with proper error handling
 * @param {Object} user - The user or agent object (not used but kept for API compatibility)
 * @param {string} alt - The alt text for the image
 * @param {string} className - The CSS class for the image
 * @returns {Object} - The image props object
 */
export const getProfilePhotoProps = (user, alt = "User", className = "w-10 h-10 rounded-full object-cover") => {
  return {
    src: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    alt: user?.username || alt,
    className
  };
};
