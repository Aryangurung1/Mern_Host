// Script to remove all agent-related data from the database
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script options (change these as needed)
const options = {
  clearRejectedRequests: false,
  clearAllRequests: false, // Set to true to clear ALL agent requests (use with caution)
  clearVerifiedAgents: false, // Set to true to remove agent status from verified agents (use with caution)
  resetToDefaultUsers: true, // Set to true to reset all users to default status (no agentRequest, no isAgent)
  userId: null, // Set a specific user ID to clear just that user's agent data, or null for all matching users
  preserveImages: true, // Set to false to delete image files as well
};

// Connect to the database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/realestate')
  .then(() => {
    console.log('Connected to MongoDB');
    clearAgentData();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function clearAgentData() {
  try {
    let query = {};
    let update = {};
    
    // Set up query based on options
    if (options.userId) {
      query._id = options.userId;
    }
    
    if (options.resetToDefaultUsers) {
      // Reset all matching users to default state (no agent status)
      query = options.userId ? { _id: options.userId } : {};
      update = { 
        $unset: { agentRequest: 1 },
        $set: { isAgent: false }
      };
      console.log('Will reset users to default status (no agent information, isAgent=false)');
    } else if (options.clearRejectedRequests) {
      query['agentRequest.status'] = 'rejected';
      update = { $unset: { agentRequest: 1 } };
    } else if (options.clearAllRequests) {
      query.agentRequest = { $exists: true };
      update = { $unset: { agentRequest: 1 } };
    }
    
    if (options.clearVerifiedAgents && !options.resetToDefaultUsers) {
      query.isAgent = true;
      update = { ...update, $set: { isAgent: false } };
    }
    
    // Get users before update for image processing
    const users = await User.find(query);
    console.log(`Found ${users.length} users matching criteria`);
    
    // Process image files if needed
    if (!options.preserveImages) {
      for (const user of users) {
        if (user.agentRequest) {
          if (user.agentRequest.profilePhoto) {
            try {
              fs.unlinkSync(user.agentRequest.profilePhoto);
              console.log(`Deleted profile photo: ${user.agentRequest.profilePhoto}`);
            } catch (err) {
              console.error(`Could not delete profile photo: ${err.message}`);
            }
          }
          
          if (user.agentRequest.citizenshipPhoto) {
            try {
              fs.unlinkSync(user.agentRequest.citizenshipPhoto);
              console.log(`Deleted citizenship photo: ${user.agentRequest.citizenshipPhoto}`);
            } catch (err) {
              console.error(`Could not delete citizenship photo: ${err.message}`);
            }
          }
        }
      }
    }
    
    // Update the database
    const result = await User.updateMany(query, update);
    console.log(`Updated ${result.modifiedCount} of ${result.matchedCount} users`);
    
    // Output the result
    if (options.resetToDefaultUsers) {
      console.log(`Reset ${result.modifiedCount} users to default status (no agent information)`);
    } else if (options.clearRejectedRequests) {
      console.log(`Cleared rejected agent requests for ${result.modifiedCount} users`);
    } else if (options.clearAllRequests) {
      console.log(`Cleared all agent requests for ${result.modifiedCount} users`);
    }
    
    if (options.clearVerifiedAgents && !options.resetToDefaultUsers) {
      console.log(`Removed agent status from ${result.modifiedCount} verified agents`);
    }
    
    mongoose.disconnect();
    console.log('Done. Disconnected from MongoDB.');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage instructions
console.log(`
AGENT DATA CLEARING SCRIPT
-------------------------
Current options:
- Clear rejected requests: ${options.clearRejectedRequests}
- Clear all requests: ${options.clearAllRequests}
- Clear verified agents: ${options.clearVerifiedAgents}
- Reset to default users: ${options.resetToDefaultUsers}
- Target user ID: ${options.userId || 'All matching users'}
- Preserve image files: ${options.preserveImages}

Edit the options in this script to change behavior.
`); 