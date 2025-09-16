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
    area: {
      type: String,
      required: [true, 'Area/Neighborhood is required'],
      enum: [
        // Nairobi Areas
        'Westlands', 'Karen', 'Kileleshwa', 'Lavington', 'Kilimani', 'Upperhill', 
        'Runda', 'Muthaiga', 'Spring Valley', 'Gigiri', 'Loresho', 'Ridgeways',
        'Parklands', 'Highridge', 'Mountain View', 'Nyari', 'Two Rivers', 'Kyuna',
        'CBD', 'Industrial Area', 'South C', 'South B', 'Lang\'ata', 'Ngong Road',
        'Hurlingham', 'Kirichwa Road', 'Lower Kabete', 'Riverside', 'Brookside',
        'Garden Estate', 'Kasarani', 'Roysambu', 'Thome', 'Zimmerman', 'Pipeline',
        'Embakasi', 'Donholm', 'Umoja', 'Komarock', 'Kayole', 'Githurai',
        'Ruaka', 'Banana', 'Limuru', 'Kikuyu', 'Ngong', 'Rongai', 'Kitengela',
        'Syokimau', 'Mlolongo', 'Katani', 'Thindigua', 'Kihara', 'Juja',
        // Other Major Cities
        'Mombasa CBD', 'Nyali', 'Bamburi', 'Kisumu', 'Nakuru', 'Eldoret',
        'Thika', 'Machakos', 'Meru', 'Nyeri', 'Naivasha', 'Nanyuki',
        // Custom option
        'Other'
      ]
    },
    customArea: {
      type: String,
      trim: true,
      // Only required if area is 'Other'
      required: function() {
        return this.location.area === 'Other';
      }
    },
    neighborhood: String, // Keep for backward compatibility
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
    order: {
      type: Number,
      default: 0
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

  // Off-Plan Properties
  isOffPlan: {
    type: Boolean,
    default: false
  },
  offPlanDetails: {
    completionDate: {
      type: Date,
      required: false
    },
    estimatedCompletionDate: {
      type: Date
    },
    constructionStartDate: {
      type: Date
    },
    constructionProgress: {
      type: Number,
      min: [0, 'Construction progress cannot be negative'],
      max: [100, 'Construction progress cannot exceed 100%'],
      default: 0
    },
    paymentPlan: [{
      stage: {
        type: String,
        enum: ['deposit', 'foundation', 'roofing', 'plumbing', 'finishing', 'completion'],
        required: true
      },
      stageName: {
        type: String,
        required: true
      },
      percentage: {
        type: Number,
        min: [0, 'Payment percentage cannot be negative'],
        max: [100, 'Payment percentage cannot exceed 100%'],
        required: true
      },
      amount: {
        type: Number,
        min: [0, 'Payment amount cannot be negative']
      },
      dueDate: Date,
      description: String
    }],
    developer: {
      name: {
        type: String,
        required: false
      },
      company: String,
      contact: {
        phone: String,
        email: String
      },
      license: String,
      website: String,
      description: String,
      established: Number,
      completedProjects: Number,
      logo: String
    },
    projectDetails: {
      projectName: String,
      totalUnits: Number,
      availableUnits: Number,
      projectType: {
        type: String,
        enum: ['residential', 'commercial', 'mixed-use', 'industrial']
      },
      amenitiesIncluded: [String],
      constructionMaterials: [String],
      architects: String,
      contractors: String,
      approvals: [{
        type: {
          type: String,
          enum: ['building_permit', 'environmental', 'water', 'electricity', 'sewerage', 'nca_approval']
        },
        number: String,
        issuedBy: String,
        issuedDate: Date,
        expiryDate: Date,
        document: {
          url: String,
          publicId: String
        }
      }]
    },
    financingOptions: {
      mortgagePartners: [String],
      minimumDeposit: {
        percentage: Number,
        amount: Number
      },
      maxFinancingPeriod: Number, // in months
      interestRates: {
        min: Number,
        max: Number
      }
    },
    updates: [{
      date: {
        type: Date,
        default: Date.now
      },
      title: String,
      description: String,
      images: [String],
      progressPercentage: Number,
      milestone: {
        type: String,
        enum: ['groundbreaking', 'foundation', 'structure', 'roofing', 'electrical', 'plumbing', 'finishing', 'landscaping', 'completion']
      }
    }]
  },
  
  // SEO and Marketing
  seo: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      sparse: true // Allow null values but ensure uniqueness when present
    },
    focusKeyword: String,
    canonicalUrl: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    twitterTitle: String,
    twitterDescription: String,
    twitterImage: String,
    structuredData: mongoose.Schema.Types.Mixed, // For JSON-LD schema markup
    autoGenerated: {
      type: Boolean,
      default: true
    },
    lastOptimized: {
      type: Date,
      default: Date.now
    }
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
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    dailyViews: [{
      date: {
        type: Date,
        default: Date.now
      },
      views: {
        type: Number,
        default: 0
      },
      uniqueViews: {
        type: Number,
        default: 0
      },
      avgTimeSpent: Number, // in seconds
      bounceRate: Number // percentage
    }],
    sources: [{
      source: String, // google, facebook, direct, etc.
      visits: {
        type: Number,
        default: 0
      }
    }],
    deviceBreakdown: {
      mobile: {
        type: Number,
        default: 0
      },
      desktop: {
        type: Number,
        default: 0
      },
      tablet: {
        type: Number,
        default: 0
      }
    },
    geographicData: [{
      country: String,
      city: String,
      visits: {
        type: Number,
        default: 0
      }
    }],
    searchKeywords: [{
      keyword: String,
      impressions: {
        type: Number,
        default: 0
      },
      clicks: {
        type: Number,
        default: 0
      },
      position: Number
    }],
    socialShares: {
      facebook: {
        type: Number,
        default: 0
      },
      twitter: {
        type: Number,
        default: 0
      },
      whatsapp: {
        type: Number,
        default: 0
      },
      linkedin: {
        type: Number,
        default: 0
      }
    },
    conversionTracking: {
      inquiries: {
        type: Number,
        default: 0
      },
      whatsappClicks: {
        type: Number,
        default: 0
      },
      phoneClicks: {
        type: Number,
        default: 0
      },
      emailClicks: {
        type: Number,
        default: 0
      }
    }
  },
  views: {
    type: Number,
    default: 0
  }, // Keep for backward compatibility
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

// Pre-save middleware to ensure only one primary image and proper ordering
propertySchema.pre('save', function(next) {
  // Validate off-plan details if isOffPlan is true
  if (this.isOffPlan) {
    console.log('DEBUG: isOffPlan is true, validating offPlanDetails:', this.offPlanDetails);
    if (!this.offPlanDetails || !this.offPlanDetails.completionDate) {
      console.log('DEBUG: Missing completion date:', this.offPlanDetails?.completionDate);
      return next(new Error('Completion date is required for off-plan properties'));
    }
    if (!this.offPlanDetails.developer || !this.offPlanDetails.developer.name) {
      console.log('DEBUG: Missing developer name:', this.offPlanDetails?.developer?.name);
      return next(new Error('Developer name is required for off-plan properties'));
    }
  }

  if (this.images && this.images.length > 0) {
    // Sort images by order field
    this.images.sort((a, b) => (a.order || 0) - (b.order || 0));

    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
      // Set first image as primary if none is set
      this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
      // Keep only the first primary image in order
      let foundPrimary = false;
      this.images.forEach((img) => {
        if (img.isPrimary && !foundPrimary) {
          foundPrimary = true;
        } else {
          img.isPrimary = false;
        }
      });
    }

    // Ensure order values are sequential
    this.images.forEach((img, index) => {
      if (img.order === undefined || img.order === null) {
        img.order = index;
      }
    });
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