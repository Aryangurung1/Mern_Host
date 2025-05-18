import User from '../models/user.model.js';
import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Admin functionality placeholder
export const adminDashboard = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Return basic admin stats
    res.status(200).json({
      message: 'Admin dashboard data',
      stats: {
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get agent requests
export const getAgentRequests = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const agentRequests = await User.find({
      agentRequest: { $exists: true }  // Find all users with agent requests, regardless of status
    }).select('_id username email agentRequest createdAt');

    res.status(200).json(agentRequests);
  } catch (error) {
    console.error('Get agent requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get verified agents
export const getVerifiedAgents = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const verifiedAgents = await User.find({
      isAgent: true
    }).select('_id username email createdAt');

    res.status(200).json(verifiedAgents);
  } catch (error) {
    console.error('Get verified agents error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending agent requests
export const getPendingAgentRequests = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const pendingRequests = await User.find({
      'agentRequest.status': 'pending'
    }).select('_id username email agentRequest createdAt');

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Get pending agent requests error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update agent status
export const updateAgentStatus = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { userId } = req.params;
    const { status, reason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.agentRequest || user.agentRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending agent request found for this user.' });
    }

    // Update agent request status
    user.agentRequest.status = status;
    user.agentRequest.processedAt = new Date();
    
    if (status === 'approved') {
      user.isAgent = true;
      user.userType = 'agent';
      user.agentApprovedAt = new Date();
    } else if (status === 'rejected') {
      // If rejected, include the reason
      user.agentRequest.reason = reason || 'Application did not meet our requirements.';
      user.isAgent = false;
      user.userType = 'regular';
    }

    await user.save();

    res.status(200).json({
      message: `Agent request ${status} successfully`,
      user
    });
  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all agents
export const getAgents = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const agents = await User.find({
      isAgent: true,
      'agentRequest.status': 'approved'
    }).select('_id username email agentRequest createdAt updatedAt agentApprovedAt isAgent userType');

    res.status(200).json(agents);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Revoke agent status (change user to regular user)
export const revokeAgentStatus = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.isAgent) {
      return res.status(400).json({ message: 'This user is not an agent.' });
    }

    // Keep the agent data but remove agent status
    user.isAgent = false;
    user.userType = 'regular';
    await user.save();

    res.status(200).json({
      message: 'Agent status revoked successfully.'
    });
  } catch (error) {
    console.error('Revoke agent status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Clear agent data for a user
export const clearAgentData = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remove agent data completely
    user.agentRequest = undefined;
    user.isAgent = false;
    user.userType = 'regular';
    await user.save();

    res.status(200).json({
      message: 'Agent data cleared successfully. User can now apply again.'
    });
  } catch (error) {
    console.error('Clear agent data error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new regular user
export const createRegularUser = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { username, email, password } = req.body;
    
    // Check if email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    
    // Create new user with regular permissions
    const newUser = new User({
      username,
      email,
      password, // This will be hashed by the pre-save hook in the User model
      isAdmin: false,
      isAgent: false,
      userType: 'regular'
    });
    
    await newUser.save();
    
    res.status(201).json({
      message: 'Regular user created successfully',
      userId: newUser._id
    });
  } catch (error) {
    console.error('Create regular user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset all non-admin users to regular users
export const resetToRegularUsers = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    // Find all non-admin users and completely remove their agent requests
    const result = await User.updateMany(
      { isAdmin: false }, 
      { 
        $set: { 
          isAgent: false, 
          userType: 'regular'
        },
        $unset: { 
          agentRequest: 1  // This completely removes the agentRequest field
        } 
      }
    );
    
    res.status(200).json({
      message: 'All non-admin users have been reset to regular users',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Reset users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Clear agent request for a specific user
export const clearAgentRequest = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remove agent request completely regardless of status
    user.agentRequest = undefined;
    user.isAgent = false;
    user.userType = 'regular';
    await user.save();

    res.status(200).json({
      message: 'Agent request cleared successfully. User can now apply again.'
    });
  } catch (error) {
    console.error('Clear agent request error:', error);
    res.status(500).json({ message: error.message });
  }
};
