import { Property } from './index.js';

// Add pre-save middleware if needed
Property.schema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default Property;
