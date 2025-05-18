import mongoose from 'mongoose';
import propertySchema from './schemas/property.schema.js';
import userSchema from './schemas/user.schema.js';
import chatSchema from './schemas/chat.schema.js';

// Initialize models
let User;
let Property;
let Chat;

try {
  // Try to get existing models first
  User = mongoose.model('User');
} catch (error) {
  // Model doesn't exist, create it
  User = mongoose.model('User', userSchema);
}

try {
  // Try to get existing models first
  Property = mongoose.model('Property');
} catch (error) {
  // Model doesn't exist, create it
  Property = mongoose.model('Property', propertySchema);
}

try {
  // Try to get existing models first
  Chat = mongoose.model('Chat');
} catch (error) {
  // Model doesn't exist, create it
  Chat = mongoose.model('Chat', chatSchema);
}

// Export initialized models
export { User, Property, Chat };