import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import fs from 'fs';
import { getFileUrl } from '../middleware/upload.js';
import Review from '../models/Review.js';

// Create a new property
export const createProperty = async (req, res) => {
  try {
    console.log('========== CREATE PROPERTY START ==========');
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    const { user } = req;
    if (!user || !user.isAgent) {
      console.log('User not authorized:', { userId: user?._id, isAgent: user?.isAgent });
      return res.status(403).json({ message: 'Only agents can create properties' });
    }
    
    // More detailed logging for debugging
    console.log('FormData keys received:', Object.keys(req.body));
    console.log('location.street value:', req.body['location.street']);
    console.log('Raw request body:', req.body);
    
    // Basic validation for essential fields
    if (!req.body.title || String(req.body.title || '').trim() === '') {
      console.log('Title validation failed:', { title: req.body.title });
      return res.status(400).json({ message: 'Title is required' });
    }
    
    if (!req.body.description || String(req.body.description || '').trim() === '') {
      console.log('Description validation failed:', { description: req.body.description });
      return res.status(400).json({ message: 'Description is required' });
    }
    
    if (!req.body.type) {
      console.log('Type validation failed:', { type: req.body.type });
      return res.status(400).json({ message: 'Property type is required' });
    }
    
    if (!req.body.price) {
      console.log('Price validation failed:', { price: req.body.price });
      return res.status(400).json({ message: 'A valid price is required' });
    }
    
    // Image validation with better logging
    console.log('Files array:', req.files);
    console.log('Files length:', req.files ? req.files.length : 0);
    
    // Better logging for debugging file uploads
    console.log('Form data image field:', req.body.propertyImages);
    console.log('Request content type:', req.get('Content-Type'));
    
    if (!req.files || req.files.length === 0) {
      console.log('Image validation failed: No files found');
      return res.status(400).json({ message: 'At least one property image is required' });
    }
    
    // Safely extract form fields with better error handling
    try {
      // Direct approach to process form data with defensive coding
      const propertyData = {
        title: String(req.body.title || '').trim(),
        description: String(req.body.description || '').trim(),
        type: req.body.type,
        status: req.body.status || 'for-sale', // Default if not provided
        price: parseInt(req.body.price) || 0, // Ensure price is a number
        location: {
          street: String(req.body['location.street'] || '').trim(),
          city: String(req.body['location.city'] || '').trim(),
          state: String(req.body['location.state'] || '').trim(),
          zipCode: String(req.body['location.zipCode'] || '').trim(),
          coordinates: {
            latitude: parseFloat(req.body['location.coordinates.latitude']) || null,
            longitude: parseFloat(req.body['location.coordinates.longitude']) || null
          }
        },
        features: {
          bedrooms: parseInt(req.body['features.bedrooms']) || 0,
          bathrooms: parseInt(req.body['features.bathrooms']) || 0,
          area: parseInt(req.body['features.area']) || 0,
          yearBuilt: parseInt(req.body['features.yearBuilt']) || 0,
          
          // Convert string 'true'/'false' to actual booleans
          parking: req.body['features.parking'] === 'true',
          furnished: req.body['features.furnished'] === 'true',
          airConditioning: req.body['features.airConditioning'] === 'true',
          swimmingPool: req.body['features.swimmingPool'] === 'true',
          fireplace: req.body['features.fireplace'] === 'true',
          laundry: req.body['features.laundry'] === 'true',
          gym: req.body['features.gym'] === 'true',
          backyard: req.body['features.backyard'] === 'true',
          securitySystem: req.body['features.securitySystem'] === 'true',
          garage: req.body['features.garage'] === 'true'
        },
        agent: user._id
      };
      
      // Process uploaded images
      const images = [];
      if (req.files && req.files.length > 0) {
        console.log(`Processing ${req.files.length} property images`);
        
        req.files.forEach((file, index) => {
          try {
            console.log(`Processing file ${index}:`, file);
            const imageUrl = getFileUrl(file.path);
            console.log(`Generated URL for file ${index}:`, imageUrl);
            images.push({
              url: imageUrl,
              caption: `Property Image ${index + 1}`
            });
          } catch (fileError) {
            console.error(`Error processing file ${index}:`, fileError);
            throw new Error(`Error processing image ${index}: ${fileError.message}`);
          }
        });
      }
      
      propertyData.images = images;
      
      console.log('Final property data to save:', JSON.stringify(propertyData, null, 2));
      
      // Create and save the property
      const property = new Property(propertyData);
      
      try {
        const savedProperty = await property.save();
        console.log('Property saved successfully with ID:', savedProperty._id);
        res.status(201).json(savedProperty);
      } catch (saveError) {
        console.error('Error saving property:', saveError);
        if (saveError.name === 'ValidationError') {
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: Object.keys(saveError.errors).reduce((acc, key) => {
              acc[key] = saveError.errors[key].message;
              return acc;
            }, {})
          });
        }
        throw saveError;
      }
    } catch (error) {
      console.error('Error processing property data:', error);
      res.status(400).json({ message: 'Error processing property data: ' + error.message });
    }
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ 
      message: 'Failed to create property: ' + error.message,
      error: error.toString(),
      stack: error.stack
    });
  } finally {
    console.log('========== CREATE PROPERTY END ==========');
  }
};

// Get all properties for an agent
export const getAgentProperties = async (req, res) => {
  try {
    const { user } = req;
    const properties = await Property.find({ agent: user._id })
      .populate('agent', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(properties);
  } catch (error) {
    console.error('Get agent properties error:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
};

// Update a property
export const updateProperty = async (req, res) => {
  try {
    console.log('========== UPDATE PROPERTY START ==========');
    console.log('Request body:', req.body);
    console.log('Files:', req.files);
    
    const { propertyId } = req.params;
    const { user } = req;
    
    // Find the property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Check ownership
    if (property.agent.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }
    
    // Process basic fields
    const basicFields = ['title', 'description', 'type', 'price', 'status'];
    basicFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        if (field === 'price') {
          property[field] = parseInt(req.body[field]) || property[field];
        } else {
          property[field] = req.body[field];
        }
      }
    });
    
    // Process location data if provided
    if (req.body.location) {
      try {
        const locationData = JSON.parse(req.body.location);
        property.location = {
          street: locationData.street || property.location.street,
          city: locationData.city || property.location.city,
          state: locationData.state || property.location.state,
          zipCode: locationData.zipCode || property.location.zipCode,
          coordinates: {
            latitude: parseFloat(locationData.coordinates.latitude) || property.location.coordinates.latitude,
            longitude: parseFloat(locationData.coordinates.longitude) || property.location.coordinates.longitude
          }
        };
      } catch (e) {
        console.error('Error parsing location data:', e);
      }
    }
    
    // Process features data if provided
    if (req.body.features) {
      try {
        const featuresData = JSON.parse(req.body.features);
        property.features = {
          ...property.features,
          ...featuresData,
          bedrooms: parseInt(featuresData.bedrooms) || property.features.bedrooms,
          bathrooms: parseInt(featuresData.bathrooms) || property.features.bathrooms,
          area: parseInt(featuresData.area) || property.features.area,
          yearBuilt: parseInt(featuresData.yearBuilt) || property.features.yearBuilt
        };
      } catch (e) {
        console.error('Error parsing features data:', e);
      }
    }
    
    // Handle existing images
    const existingImages = property.images || [];
    let updatedImages = [];
    
    // Keep only the images that were not removed
    if (req.body.existingImages) {
      try {
        const existingImageIds = JSON.parse(req.body.existingImages);
        updatedImages = existingImages.filter(img => existingImageIds.includes(img._id.toString()));
      } catch (e) {
        console.error('Error parsing existing image data:', e);
        updatedImages = existingImages;
      }
    } else {
      updatedImages = existingImages;
    }
    
    // Process new uploaded images
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} new property images`);
      
      req.files.forEach((file, index) => {
        try {
          console.log(`Processing file ${index}:`, file);
          const imageUrl = getFileUrl(file.path);
          console.log(`Generated URL for file ${index}:`, imageUrl);
          updatedImages.push({
            url: imageUrl,
            caption: `Property Image ${updatedImages.length + 1}`
          });
        } catch (fileError) {
          console.error(`Error processing file ${index}:`, fileError);
        }
      });
    }
    
    // Update the property images
    property.images = updatedImages;
    
    // Save the updated property
    const updatedProperty = await property.save();
    console.log('Property updated successfully with ID:', updatedProperty._id);
    
    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ 
      message: 'Failed to update property: ' + error.message,
      error: error.toString(),
      stack: error.stack
    });
  } finally {
    console.log('========== UPDATE PROPERTY END ==========');
  }
};

// Delete a property
export const deleteProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { user } = req;
    
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (property.agent.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }
    
    await property.deleteOne();
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Failed to delete property' });
  }
};

// Update agent profile
export const updateAgentProfile = async (req, res) => {
  try {
    const { user } = req;
    const updates = req.body;
    
    console.log('Update Agent Profile - Request Body:', req.body);
    console.log('Update Agent Profile - Files:', req.files);
    
    // If user is not an agent, they can't update agent profile
    if (!user.isAgent) {
      return res.status(403).json({ message: 'Not authorized to update agent profile' });
    }
    
    // Handle profile photo if updated
    if (req.files && req.files.profilePhoto) {
      const profilePhoto = req.files.profilePhoto[0].path;
      updates.profilePhoto = profilePhoto;
      updates.profilePhotoUrl = getFileUrl(profilePhoto);
      console.log('New profile photo path:', profilePhoto);
      console.log('New profile photo URL:', updates.profilePhotoUrl);
    }
    
    // Merge existing agent request data with updates
    const updatedAgentRequest = {
      ...user.agentRequest,
      ...updates,
      // Ensure these fields are preserved if they exist
      status: user.agentRequest?.status || 'approved',
      submittedAt: user.agentRequest?.submittedAt || new Date(),
      processedAt: user.agentRequest?.processedAt
    };
    
    console.log('Updated agent request data:', updatedAgentRequest);
    
    // Update the user document
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: { 'agentRequest': updatedAgentRequest } },
      { new: true }
    ).select('-password');
    
    console.log('User updated successfully');
    
    // Return success with updated user data
    res.status(200).json({ 
      message: 'Agent profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update agent profile error:', error);
    res.status(500).json({ message: 'Failed to update agent profile: ' + error.message });
  }
};

// Register a new agent
export const registerAgent = async (req, res) => {
  console.log('--- Register Agent Request Start ---');
  try {
    const { user } = req;
    console.log('User ID:', user?._id || 'No user authenticated');
    
    if (!user) {
      console.error('[Validation Error] No user found in the request object');
      return res.status(401).json({ message: 'Authentication required. Please sign in again.' });
    }
    
    console.log('Received Body:', JSON.stringify(req.body, null, 2));
    console.log('Received Files:', req.files ? JSON.stringify(req.files, null, 2) : 'No files received');
    
    // --- Validation Starts ---
    console.log('Starting validation...');
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'specialization', 'location', 'address', 'experience', 'citizenshipNo'];
    for (const field of requiredFields) {
      console.log(`Checking required field: ${field} -> Value: ${req.body[field]}`);
      if (!req.body[field]) {
        console.error(`[Validation Error] Missing required field: ${field}`);
        return res.status(400).json({ message: `${field} is required` });
      }
    }
    
    // Validate phone number
    console.log(`Checking phone format: ${req.body.phone}`);
    if (!/^[0-9]{10}$/.test(req.body.phone)) {
      console.error(`[Validation Error] Invalid phone format: ${req.body.phone}`);
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }
    
    // Validate files
    console.log('Checking for required files...');
    if (!req.files || !req.files.profilePhoto || !req.files.citizenshipPhoto) {
      console.error('[Validation Error] Missing required photo files. Received files:', req.files ? JSON.stringify(req.files) : 'None');
      return res.status(400).json({ message: 'Both profile photo and citizenship photo are required' });
    }
    console.log('Required files check passed.');

    // Get file information
    const profilePhoto = req.files.profilePhoto[0];
    const citizenshipPhoto = req.files.citizenshipPhoto[0];

    console.log('Profile Photo Details:', { filename: profilePhoto.filename, path: profilePhoto.path });
    console.log('Citizenship Photo Details:', { filename: citizenshipPhoto.filename, path: citizenshipPhoto.path });
    
    // --- Validation Ends ---
    console.log('Validation passed successfully.');

    // Create agent request object with pending status
    const agentRequest = {
      ...req.body,
      status: 'pending', // Set to pending until admin approves
      submittedAt: new Date(),
      profilePhoto: profilePhoto.path,
      profilePhotoUrl: getFileUrl(profilePhoto.path),
      citizenshipPhoto: citizenshipPhoto.path,
      citizenshipPhotoUrl: getFileUrl(citizenshipPhoto.path)
    };

    console.log('Constructed agentRequest object:', JSON.stringify(agentRequest, null, 2));

    // Update user with agent request - but keep as regular user until admin approval
    console.log(`Updating user ${user._id} with agent request...`);
    await User.findByIdAndUpdate(user._id, { 
      $set: { 
        'agentRequest': agentRequest,
        isAgent: false, // Not an agent yet - pending admin approval
        userType: 'regular' // Still regular user until approved
      } 
    });
    console.log(`User ${user._id} updated successfully.`);

    console.log('--- Register Agent Request End (Success) ---');
    res.status(200).json({ 
      message: 'Your agent application has been submitted for review. You will be notified once approved.' 
    });
  } catch (error) {
    console.error('--- Register Agent Request End (Error) ---');
    console.error('[Server Error] Register agent error:', error);
    res.status(500).json({ message: 'Failed to register as agent' });
  }
};

// Clear rejected agent request for a user
export const clearRejectedAgentRequest = async (req, res) => {
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

    if (!user.agentRequest || user.agentRequest.status !== 'rejected') {
      return res.status(400).json({ message: 'No rejected agent request found for this user.' });
    }

    // Clear the rejected agent request and set user back to regular
    user.agentRequest = undefined;
    user.isAgent = false;
    user.userType = 'regular';
    await user.save();

    res.status(200).json({
      message: 'Rejected agent request cleared successfully. User can now apply again.'
    });
  } catch (error) {
    console.error('Clear rejected agent request error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update agent status (admin only)
export const updateAgentStatus = async (req, res) => {
  try {
    // Verify the user is an admin
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { userId } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.agentRequest) {
      return res.status(400).json({ message: 'No agent request found for this user.' });
    }

    // Update agent request status and userType
    user.agentRequest.status = status;
    user.agentRequest.processedAt = new Date();
    
    if (status === 'approved') {
      user.isAgent = true;
      user.userType = 'agent';
    } else {
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

// Clear user's own agent request
export const clearOwnAgentRequest = async (req, res) => {
  try {
    const { user } = req;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const existingUser = await User.findById(user._id);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if the user is an agent or has an agent request
    if (!existingUser.isAgent && !existingUser.agentRequest) {
      return res.status(400).json({ message: 'No agent status found for this user' });
    }
    
    // Remove agent status completely
    existingUser.agentRequest = undefined;
    existingUser.isAgent = false;
    existingUser.userType = 'regular';
    await existingUser.save();
    
    return res.status(200).json({ 
      message: 'Agent status cleared successfully. You can now apply again as a regular user.' 
    });
  } catch (error) {
    console.error('Clear own agent request error:', error);
    return res.status(500).json({ message: 'Failed to clear agent status' });
  }
};

// Get all agents
export const getAllAgents = async (req, res) => {
  try {
    const agents = await User.find({ 
      isAgent: true,
      'agentRequest.status': 'approved'
    }).select('-password');
    
    res.status(200).json(agents);
  } catch (error) {
    console.error('Get all agents error:', error);
    res.status(500).json({ message: 'Failed to fetch agents' });
  }
};

// Get agent by ID
export const getAgentById = async (req, res) => {
  try {
    console.log('========== GET AGENT BY ID START ==========');
    const { id } = req.params;
    console.log('Requested agent ID:', id);
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Invalid agent ID format:', id);
      return res.status(400).json({ error: 'Invalid agent ID format' });
    }

    try {
      // Find the agent by ID first without population
      console.log('Finding user in database...');
      const agent = await User.findById(id).select('-password');
      
      console.log('User found:', agent ? 'Yes' : 'No');
      if (!agent) {
        console.log('Agent not found');
        return res.status(404).json({ error: 'Agent not found' });
      }

      console.log('Raw agent data:', JSON.stringify({
        id: agent._id,
        username: agent.username,
        isAgent: agent.isAgent,
        agentRequestStatus: agent.agentRequest?.status
      }));

      // Check if user is an approved agent
      if (!agent.isAgent || agent.agentRequest?.status !== 'approved') {
        console.log('User found but not an approved agent:', {
          isAgent: agent.isAgent,
          requestStatus: agent.agentRequest?.status
        });
        return res.status(403).json({ error: 'User is not an approved agent' });
      }

      // Find properties separately
      console.log('Finding properties for agent...');
      const properties = await Property.find({ agent: id })
        .select('title description type price location images features createdAt updatedAt')
        .lean();

      console.log(`Found ${properties.length} properties for agent`);

      // Prepare response data
      const responseData = {
        _id: agent._id,
        username: agent.username,
        email: agent.email,
        photo: agent.photo,
        isAgent: agent.isAgent,
        userType: agent.userType,
        agentRequest: agent.agentRequest,
        properties: properties || [],
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      };

      console.log('Agent data prepared successfully');
      console.log('========== GET AGENT BY ID END (SUCCESS) ==========');
      return res.json(responseData);
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      console.error('Error stack:', dbError.stack);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }
  } catch (error) {
    console.error('========== GET AGENT BY ID END (ERROR) ==========');
    console.error('Error fetching agent by ID:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error while fetching agent data',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get agent reviews
export const getAgentReviews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reviews = await Review.find({ agent: id })
      .populate('user', 'username photo')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching agent reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Create agent review
export const createAgentReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // Check if user has already reviewed this agent
    const existingReview = await Review.findOne({
      agent: id,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({ 
        error: 'You have already reviewed this agent. You can only submit one review per agent.' 
      });
    }

    const review = new Review({
      agent: id,
      user: userId,
      rating,
      comment
    });

    await review.save();

    // Populate user data
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'username photo');

    // Update agent's average rating
    const allReviews = await Review.find({ agent: id });
    const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

    await User.findByIdAndUpdate(id, {
      $set: { 'agentRequest.rating': avgRating }
    });

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// Delete agent review
export const deleteAgentReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const userId = req.user._id;

    // Find the review
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if the user is authorized to delete this review
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update agent's average rating
    const allReviews = await Review.find({ agent: id });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length
      : 0;

    await User.findByIdAndUpdate(id, {
      $set: { 'agentRequest.rating': avgRating }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};
