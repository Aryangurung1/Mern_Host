import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']
  },
  status: {
    type: String,
    required: true,
    enum: ['for-sale', 'for-rent', 'sold', 'rented'],
    default: 'for-sale'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      }
    }
  },
  features: {
    bedrooms: {
      type: Number,
      default: 0
    },
    bathrooms: {
      type: Number,
      default: 0
    },
    area: {
      type: Number,
      default: 0
    },
    yearBuilt: {
      type: Number,
      default: 0
    },
    parking: {
      type: Boolean,
      default: false
    },
    furnished: {
      type: Boolean,
      default: false
    },
    airConditioning: {
      type: Boolean,
      default: false
    },
    swimmingPool: {
      type: Boolean,
      default: false
    },
    fireplace: {
      type: Boolean,
      default: false
    },
    laundry: {
      type: Boolean,
      default: false
    },
    gym: {
      type: Boolean,
      default: false
    },
    backyard: {
      type: Boolean,
      default: false
    },
    securitySystem: {
      type: Boolean,
      default: false
    },
    garage: {
      type: Boolean,
      default: false
    }
  },
  images: [{
    url: String,
    caption: String
  }],
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add any indexes if needed
propertySchema.index({ type: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ agent: 1 });
propertySchema.index({ 'location.city': 1 });

export default propertySchema; 