import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isAgent: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    enum: ['regular', 'agent', 'admin'],
    default: 'regular'
  },
  agentRequest: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    specialization: String,
    address: String,
    experience: Number,
    citizenshipNo: String,
    profilePhoto: String,
    profilePhotoUrl: String,
    citizenshipPhoto: String,
    citizenshipPhotoUrl: String,
    bio: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reason: String,
    submittedAt: Date,
    processedAt: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for properties
userSchema.virtual('properties', {
  ref: 'Property',
  localField: '_id',
  foreignField: 'agent'
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
userSchema.index({ isAgent: 1 });
userSchema.index({ isAdmin: 1 });
userSchema.index({ 'agentRequest.status': 1 });

export default userSchema; 