import User from '../models/user.model.js';
import { getFileUrl } from '../middleware/upload.js';

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { user } = req;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { user } = req;
    const updates = req.body;
    
    console.log('Updating user profile:', user._id);
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Don't allow changing sensitive fields directly
    delete updates.password;
    delete updates.isAdmin;
    delete updates.isAgent;
    
    // Handle profile photo if updated
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto[0].path;
      console.log('Profile photo path:', profilePhoto);
      updates.photo = getFileUrl(profilePhoto);
      console.log('Generated photo URL:', updates.photo);
    }
    
    console.log('Final updates to apply:', updates);
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      { $set: updates },
      { new: true }
    );
    
    console.log('Updated user in database:', updatedUser);
    
    // Return updated user without sensitive info
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ message: 'Failed to update user profile' });
  }
};
