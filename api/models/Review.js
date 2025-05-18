import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Add a compound index for better query performance (not unique)
reviewSchema.index({ agent: 1, user: 1 });

export default mongoose.model('Review', reviewSchema); 