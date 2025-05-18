import Property from '../models/property.model.js';

// Get all properties
export const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('agent', 'username email')
      .select('-__v');

    res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get property by ID
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('agent', 'username email fullName agentRequest.profilePhotoUrl agentRequest.phone agentRequest.specialization isAgent')
      .select('-__v');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.status(200).json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new property
export const createProperty = async (req, res) => {
  try {
    const { title, description, price, location, type, images, agent } = req.body;

    const property = new Property({
      title,
      description,
      price,
      location,
      type,
      images,
      agent: req.user._id
    });

    await property.save();
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Only allow the agent who created the property to update it
    if (property.agent.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Access denied. Only the agent who created this property can update it.' });
    }

    const { title, description, price, location, type, images } = req.body;
    Object.assign(property, { title, description, price, location, type, images });

    await property.save();
    res.status(200).json(property);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Only allow the agent who created the property to delete it
    if (property.agent.toString() !== req.user._id) {
      return res.status(403).json({ message: 'Access denied. Only the agent who created this property can delete it.' });
    }

    await property.deleteOne();
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get featured properties
export const getFeaturedProperties = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const properties = await Property.find({ featured: true })
      .populate('agent', 'username email fullName agentRequest.profilePhotoUrl agentRequest.phone agentRequest.specialization isAgent')
      .select('-__v')
      .limit(limit);

    res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    res.status(500).json({ message: error.message });
  }
};
