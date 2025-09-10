import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Property description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Property Type and Category
  propertyType: {
    type: String,
    enum: ['house', 'apartment', 'villa', 'townhouse', 'land', 'commercial', 'office', 'shop'],
    required: [true, 'Property type is required']
  },
  category: {
    type: String,
    enum: ['sale', 'rent', 'lease'],
    required: [true, 'Property category is required']
  },
  
  // Location
  location: {
    address: {
      type: String,
      required: [true, 'Property address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    county: {
      type: String,
      required: [true, 'County is required']
    },
    neighborhood: String,
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  
  // Pricing
  price: {
    amount: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    currency: {
      type: String,
      enum: ['KES', 'USD', 'EUR'],
      default: 'KES'
    },
    period: {
      type: String,
      enum: ['month', 'year', 'one-time'],
      default: function() {
        return this.category === 'sale' ? 'one-time' : 'month';
      }
    }
  },
  
  // Property Features
  features: {
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative']
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative']
    },
    area: {
      size: {
        type: Number,
        min: [1, 'Area size must be positive']
      },
      unit: {
        type: String,
        enum: ['sqm', 'sqft', 'acres'],
        default: 'sqm'
      }
    },
    parking: {
      type: Number,
      min: [0, 'Parking spaces cannot be negative'],
      default: 0
    },
    floors: {
      type: Number,
      min: [1, 'Must have at least 1 floor'],
      default: 1
    }
  },
  
  // Amenities
  amenities: [{
    name: String,
    icon: String,
    description: String
  }],
  
  // Media
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Documents
  documents: [{
    title: String,
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ['title_deed', 'survey_plan', 'building_plan', 'valuation', 'other']
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status and Availability
  status: {
    type: String,
    enum: ['active', 'sold', 'rented', 'inactive', 'draft'],
    default: 'draft'
  },
  availability: {
    available: {
      type: Boolean,
      default: true
    },
    availableFrom: Date,
    reason: String
  },
  
  // SEO and Marketing
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Owner/Agent Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  inquiries: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    contactInfo: {
      name: String,
      email: String,
      phone: String
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'interested', 'not_interested', 'closed'],
      default: 'new'
    }
  }],
  
  // Additional Information
  yearBuilt: Number,
  condition: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair', 'needs_renovation']
  },
  furnishing: {
    type: String,
    enum: ['unfurnished', 'semi_furnished', 'fully_furnished']
  },
  
  // Utilities
  utilities: {
    electricity: {
      type: Boolean,
      default: true
    },
    water: {
      type: Boolean,
      default: true
    },
    internet: {
      type: Boolean,
      default: false
    },
    gas: {
      type: Boolean,
      default: false
    },
    security: {
      type: Boolean,
      default: false
    }
  },
  
  // Notes (internal)
  internalNotes: String,
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.internalNotes; // Don't expose internal notes in JSON
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
propertySchema.index({ location: 1 });
propertySchema.index({ propertyType: 1, category: 1 });
propertySchema.index({ 'price.amount': 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for formatted price
propertySchema.virtual('formattedPrice').get(function() {
  const price = this.price.amount;
  const currency = this.price.currency;
  const period = this.price.period;
  
  let formatted = `${currency} ${price.toLocaleString()}`;
  if (period !== 'one-time') {
    formatted += `/${period}`;
  }
  return formatted;
});

// Virtual for primary image
propertySchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || (this.images.length > 0 ? this.images[0] : null);
});

// Pre-save middleware to ensure only one primary image
propertySchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        img.isPrimary = index === this.images.findIndex(i => i.isPrimary);
      });
    }
  }
  next();
});

// Static method to find properties within a radius
propertySchema.statics.findWithinRadius = function(lat, lng, radiusInKm) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert to meters
      }
    }
  });
};

// Method to increment view count
propertySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

export default mongoose.model('Property', propertySchema);