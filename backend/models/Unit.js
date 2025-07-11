// backend/models/Unit.js
import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  // Basic Information
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  unitNumber: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  
  // Floor Information - FLEXIBLE APPROACH
  floor: {
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Floor'
      // NOT required - floors are optional for single units/houses
    },
    floorNumber: {
      type: String,
      trim: true
      // Can be "Ground", "1st", "2nd", etc. or null for single-story
    },
    floorName: {
      type: String,
      trim: true
      // Optional: "Penthouse", "Basement", "Mezzanine", etc.
    },
    // For cases where owner owns individual units without floor management
    isStandalone: {
      type: Boolean,
      default: false // If true, floor management is bypassed
    }
  },
  
  // Unit Type and Purpose
  type: {
    type: String,
    enum: ['rental', 'bnb', 'commercial', 'storage', 'parking', 'mixed'],
    required: true,
    default: 'rental',
    index: true
  },
  
  // Usage Configuration for Mixed-Use
  usageConfig: {
    primaryUse: {
      type: String,
      enum: ['rental', 'bnb', 'commercial'],
      required: true
    },
    secondaryUse: {
      type: String,
      enum: ['rental', 'bnb', 'commercial', 'storage']
    },
    // Allow switching between uses
    canSwitchUse: {
      type: Boolean,
      default: false
    },
    // Schedule for mixed use (e.g., BnB on weekends, rental on weekdays)
    usageSchedule: [{
      days: [String], // ['monday', 'tuesday', etc.]
      useType: String,
      startTime: String,
      endTime: String
    }]
  },

  // Physical Details
  specifications: {
    bedrooms: {
      type: Number,
      required: true,
      min: 0,
      max: 20
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
      validate: {
        validator: function(value) {
          return value >= 0.5; // Allow half bathrooms
        },
        message: 'Bathrooms must be at least 0.5'
      }
    },
    size: {
      value: Number, // Square footage/meters
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      }
    },
    furnished: {
      type: String,
      enum: ['unfurnished', 'semi-furnished', 'fully-furnished'],
      default: 'unfurnished'
    },
    features: [String], // ['balcony', 'parking', 'garden', etc.]
    appliances: [String] // ['refrigerator', 'washing_machine', etc.]
  },

  // Status and Availability
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved', 'out_of_service'],
    default: 'available',
    index: true
  },
  
  // Occupancy Information
  occupancy: {
    // For traditional rental
    currentTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    },
    lastOccupiedDate: Date,
    lastVacatedDate: Date,
    occupancyHistory: [{
      tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
      startDate: Date,
      endDate: Date,
      reason: String // 'lease_end', 'eviction', 'voluntary', etc.
    }]
  },

  // Rental Configuration
  rental: {
    rentAmount: {
      type: Number,
      required: function() { 
        return this.type === 'rental' || this.usageConfig?.primaryUse === 'rental'; 
      },
      min: 0
    },
    currency: {
      type: String,
      default: 'KES'
    },
    paymentFrequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'annually'],
      default: 'monthly'
    },
    securityDeposit: {
      type: Number,
      min: 0,
      default: 0
    },
    utilitiesIncluded: [String], // ['water', 'electricity', 'internet', etc.]
    petPolicy: {
      allowed: Boolean,
      deposit: Number,
      restrictions: [String]
    }
  },

  // BnB Configuration
  bnb: {
    isActive: {
      type: Boolean,
      default: false
    },
    // Pricing
    pricing: {
      basePrice: {
        type: Number,
        required: function() { 
          return this.type === 'bnb' || this.usageConfig?.primaryUse === 'bnb'; 
        },
        min: 0
      },
      currency: {
        type: String,
        default: 'KES'
      },
      cleaningFee: { type: Number, default: 0 },
      securityDeposit: { type: Number, default: 0 },
      extraGuestFee: { type: Number, default: 0 },
      weekendMultiplier: { type: Number, default: 1 }, // Weekend price multiplier
      seasonalRates: [{
        name: String, // 'High Season', 'Holiday', etc.
        startDate: Date,
        endDate: Date,
        priceMultiplier: Number
      }]
    },
    
    // Guest Management
    guestLimits: {
      maxGuests: { type: Number, default: 2 },
      maxAdults: Number,
      maxChildren: Number,
      infantsAllowed: { type: Boolean, default: true }
    },
    
    // Check-in/out
    checkInOut: {
      checkInTime: { type: String, default: '15:00' },
      checkOutTime: { type: String, default: '11:00' },
      selfCheckIn: { type: Boolean, default: false },
      keyLocation: String, // For self check-in
      instructions: String
    },
    
    // Booking Rules
    bookingRules: {
      minimumStay: { type: Number, default: 1 }, // nights
      maximumStay: { type: Number, default: 30 },
      advanceBooking: { type: Number, default: 365 }, // days
      instantBook: { type: Boolean, default: false },
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict', 'super_strict'],
        default: 'moderate'
      }
    },
    
    // Platforms
    platforms: [{
      name: {
        type: String,
        enum: ['airbnb', 'booking.com', 'vrbo', 'expedia', 'direct', 'other']
      },
      listingId: String,
      isActive: { type: Boolean, default: true },
      commissionRate: Number, // Platform commission %
      lastSynced: Date
    }],
    
    // Amenities and House Rules
    amenities: [String], // ['wifi', 'kitchen', 'parking', 'pool', etc.]
    houseRules: [String],
    safetyFeatures: [String], // ['smoke_detector', 'fire_extinguisher', etc.]
    
    // Current Bookings
    currentBookings: [{
      guest: {
        name: String,
        email: String,
        phone: String,
        adults: Number,
        children: Number,
        infants: Number
      },
      dates: {
        checkIn: Date,
        checkOut: Date,
        nights: Number
      },
      pricing: {
        baseAmount: Number,
        cleaningFee: Number,
        extraGuestFees: Number,
        taxes: Number,
        totalAmount: Number
      },
      booking: {
        reference: String,
        platform: String,
        status: {
          type: String,
          enum: ['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],
          default: 'confirmed'
        },
        bookedAt: Date,
        source: String // 'direct', 'airbnb', etc.
      },
      communication: {
        lastContact: Date,
        notes: [String],
        specialRequests: String
      }
    }],
    
    // Availability Calendar
    availability: [{
      date: Date,
      available: { type: Boolean, default: true },
      price: Number, // Override base price for specific dates
      minimumStay: Number, // Override minimum stay for specific dates
      reason: String, // 'booked', 'blocked', 'maintenance', etc.
      notes: String
    }]
  },

  // Financial Tracking
  financials: {
    currentMonth: {
      rental: { type: Number, default: 0 },
      bnb: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      profit: { type: Number, default: 0 }
    },
    yearToDate: {
      rental: { type: Number, default: 0 },
      bnb: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      profit: { type: Number, default: 0 }
    },
    lifetime: {
      rental: { type: Number, default: 0 },
      bnb: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      profit: { type: Number, default: 0 }
    },
    lastUpdated: Date
  },

  // Performance Metrics
  metrics: {
    // Rental metrics
    rental: {
      occupancyRate: { type: Number, default: 0 }, // %
      averageLeaseLength: Number, // months
      tenantSatisfaction: Number, // 1-5 rating
      renewalRate: { type: Number, default: 0 }, // %
      daysVacant: { type: Number, default: 0 }
    },
    
    // BnB metrics
    bnb: {
      occupancyRate: { type: Number, default: 0 }, // %
      averageDailyRate: Number,
      revPAR: Number, // Revenue per available room
      averageStayLength: Number, // nights
      guestRating: Number, // 1-5 average
      bookingLeadTime: Number, // days in advance
      cancellationRate: { type: Number, default: 0 }, // %
      cleaningTime: Number // hours between bookings
    }
  },

  // Maintenance and Condition
  maintenance: {
    lastInspection: Date,
    nextInspection: Date,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'needs_renovation'],
      default: 'good'
    },
    issues: [{
      description: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent']
      },
      reportedDate: Date,
      status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'deferred']
      }
    }],
    lastRenovation: Date,
    renovationHistory: [{
      date: Date,
      type: String, // 'major', 'minor', 'cosmetic'
      description: String,
      cost: Number
    }]
  },

  // Images and Documents
  media: {
    images: [{
      url: String,
      caption: String,
      isMain: { type: Boolean, default: false },
      uploadDate: { type: Date, default: Date.now },
      tags: [String] // ['exterior', 'kitchen', 'bedroom', etc.]
    }],
    virtualTour: String, // URL to virtual tour
    floorPlan: String // URL to floor plan
  },

  // Notes and Internal Information
  notes: String,
  internalNotes: String, // Staff only
  
  // Audit fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });
unitSchema.index({ propertyId: 1, status: 1 });
unitSchema.index({ type: 1, status: 1 });
unitSchema.index({ 'occupancy.currentTenant': 1 });
unitSchema.index({ 'floor.floorId': 1 });
unitSchema.index({ 'bnb.isActive': 1 });
unitSchema.index({ 'bnb.currentBookings.dates.checkIn': 1 });
unitSchema.index({ 'bnb.currentBookings.dates.checkOut': 1 });

// Virtual properties
unitSchema.virtual('isOccupied').get(function() {
  return this.status === 'occupied' || 
         (this.bnb?.currentBookings?.length > 0);
});

unitSchema.virtual('monthlyIncome').get(function() {
  if (this.type === 'rental') {
    return this.rental?.rentAmount || 0;
  }
  if (this.type === 'bnb') {
    // Estimate monthly income based on average occupancy and daily rate
    const dailyRate = this.bnb?.pricing?.basePrice || 0;
    const occupancyRate = this.metrics?.bnb?.occupancyRate || 0;
    return (dailyRate * 30 * (occupancyRate / 100));
  }
  return 0;
});

unitSchema.virtual('displayAddress').get(function() {
  const floorInfo = this.floor?.floorNumber ? `, Floor ${this.floor.floorNumber}` : '';
  return `Unit ${this.unitNumber}${floorInfo}`;
});

// Instance methods
unitSchema.methods.checkBnbAvailability = function(checkIn, checkOut) {
  if (this.type !== 'bnb' && this.usageConfig?.primaryUse !== 'bnb') {
    return false;
  }
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Check for conflicts with existing bookings
  return !this.bnb.currentBookings.some(booking => {
    if (booking.booking.status === 'cancelled') return false;
    
    const bookingCheckIn = new Date(booking.dates.checkIn);
    const bookingCheckOut = new Date(booking.dates.checkOut);
    
    return (checkInDate < bookingCheckOut && checkOutDate > bookingCheckIn);
  });
};

unitSchema.methods.addBnbBooking = function(bookingData) {
  if (!this.checkBnbAvailability(bookingData.dates.checkIn, bookingData.dates.checkOut)) {
    throw new Error('Unit not available for selected dates');
  }
  
  // Calculate nights
  const checkIn = new Date(bookingData.dates.checkIn);
  const checkOut = new Date(bookingData.dates.checkOut);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  
  // Calculate pricing
  const baseAmount = this.bnb.pricing.basePrice * nights;
  const cleaningFee = this.bnb.pricing.cleaningFee || 0;
  const extraGuests = Math.max(0, (bookingData.guest.adults || 0) - 2);
  const extraGuestFees = extraGuests * (this.bnb.pricing.extraGuestFee || 0);
  const totalAmount = baseAmount + cleaningFee + extraGuestFees;
  
  const booking = {
    ...bookingData,
    dates: {
      ...bookingData.dates,
      nights
    },
    pricing: {
      baseAmount,
      cleaningFee,
      extraGuestFees,
      totalAmount
    },
    booking: {
      ...bookingData.booking,
      reference: this.generateBookingReference(),
      bookedAt: new Date()
    }
  };
  
  this.bnb.currentBookings.push(booking);
  return booking;
};

unitSchema.methods.generateBookingReference = function() {
  return `${this.propertyId.toString().slice(-4)}-${this.unitNumber}-${Date.now().toString().slice(-6)}`;
};

unitSchema.methods.switchUsageType = function(newType, startDate = new Date()) {
  if (!this.usageConfig?.canSwitchUse) {
    throw new Error('Unit is not configured for usage switching');
  }
  
  // Clear current occupancy based on old type
  if (this.type === 'rental' && this.occupancy.currentTenant) {
    throw new Error('Cannot switch usage while unit has active tenant');
  }
  
  if (this.type === 'bnb' && this.bnb.currentBookings.length > 0) {
    const activeBookings = this.bnb.currentBookings.filter(
      booking => booking.booking.status === 'confirmed' && 
                 new Date(booking.dates.checkOut) > startDate
    );
    if (activeBookings.length > 0) {
      throw new Error('Cannot switch usage while unit has active bookings');
    }
  }
  
  this.type = newType;
  this.usageConfig.primaryUse = newType;
  
  if (newType === 'bnb') {
    this.bnb.isActive = true;
  } else {
    this.bnb.isActive = false;
  }
  
  return this.save();
};

// Static methods
unitSchema.statics.findAvailableUnits = function(propertyId, type = 'rental') {
  return this.find({
    propertyId,
    type,
    status: 'available'
  });
};

unitSchema.statics.findBnbAvailableUnits = function(propertyId, checkIn, checkOut) {
  // This would need more complex aggregation to check availability
  return this.find({
    propertyId,
    $or: [{ type: 'bnb' }, { 'usageConfig.primaryUse': 'bnb' }],
    'bnb.isActive': true
  });
};

// Pre-save middleware
unitSchema.pre('save', function(next) {
  // Validate floor requirements based on property type
  if (this.isModified('floor') || this.isNew) {
    // Skip floor validation if unit is standalone
    if (this.floor?.isStandalone) {
      this.floor.floorId = undefined;
      this.floor.floorNumber = undefined;
    }
  }
  
  // Update financial totals
  if (this.isModified('financials.currentMonth')) {
    const cm = this.financials.currentMonth;
    cm.total = (cm.rental || 0) + (cm.bnb || 0);
    cm.profit = cm.total - (cm.expenses || 0);
  }
  
  next();
});

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;