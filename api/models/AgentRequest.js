// Agent functionality has been removed from the backend
// This file is kept as a placeholder for future implementation if needed

import mongoose from 'mongoose';

const agentRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  citizenshipNo: {
    type: String,
    required: true
  },
  profilePhotoUrl: String,
  citizenshipPhotoUrl: String,
  bio: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  reason: String
}, { timestamps: true });

const AgentRequest = mongoose.models.AgentRequest || mongoose.model('AgentRequest', agentRequestSchema);
export default AgentRequest; 