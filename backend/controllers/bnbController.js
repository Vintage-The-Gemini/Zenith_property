// backend/controllers/bnbController.js
import Unit from '../models/Unit.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { addDays, differenceInDays, format, isWithinInterval, parseISO } from 'date-fns';

/**
 * Get all BnB units with filtering and availability
 */
export const getBnBUnits = async (req, res) => {
  try {
    const {
      propertyId,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      amenities,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter for BnB units
    const filter = {
      $or: [
        { type: 'bnb' },
        { 'usageConfig.primaryUse': 'bnb' }
      ],
      'bnb.isActive': true
    };

    if (propertyId) filter.propertyId = propertyId;

    // Price range filter
    if (minPrice || maxPrice) {
      filter['bnb.pricing.basePrice'] = {};
      if (minPrice) filter['bnb.pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) filter['bnb.pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    // Guest capacity filter
    if (guests) {
      filter['bnb.guestLimits.maxGuests'] = { $gte: parseInt(guests) };
    }

    // Amenities filter
    if (amenities) {
      const amenityList = amenities.split(',');
      filter['bnb.amenities'] = { $all: amenityList };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let units = await Unit.find(filter)
      .populate('propertyId', 'name address')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ 'bnb.pricing.basePrice': 1 });

    // Filter by availability if dates provided
    if (checkIn && checkOut) {
      units = units.filter(unit => 
        unit.checkBnbAvailability(checkIn, checkOut)
      );
    }

    // Calculate total with availability filtering
    const total = units.length;

    // Enhance units with calculated data
    const enhancedUnits = units.map(unit => {
      const unitObj = unit.toObject();
      
      // Calculate pricing for the stay if dates provided
      if (checkIn && checkOut) {
        const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
        const pricing = calculateBookingPrice(unit, checkIn, checkOut, guests || 2);
        unitObj.stayPricing = {
          nights,
          ...pricing
        };
      }

      // Add availability status
      unitObj.availabilityStatus = checkIn && checkOut ? 
        unit.checkBnbAvailability(checkIn, checkOut) ? 'available' : 'unavailable' :
        'unknown';

      return unitObj;
    });

    res.json({
      units: enhancedUnits,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      filters: {
        checkIn,
        checkOut,
        guests,
        propertyId,
        priceRange: { min: minPrice, max: maxPrice }
      }
    });

  } catch (error) {
    logger.error(`Error fetching BnB units: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { unitId } = req.params;
    const {
      guest,
      checkIn,
      checkOut,
      guests: guestCount,
      platform = 'direct',
      specialRequests,
      paymentInfo
    } = req.body;

    // Validate required fields
    if (!guest?.name || !guest?.email || !checkIn || !checkOut) {
      throw new Error('Guest name, email, check-in and check-out dates are required');
    }

    // Get and validate unit
    const unit = await Unit.findById(unitId).session(session);
    if (!unit) {
      throw new Error('Unit not found');
    }

    if (unit.type !== 'bnb' && unit.usageConfig?.primaryUse !== 'bnb') {
      throw new Error('Unit is not configured for BnB bookings');
    }

    if (!unit.bnb?.isActive) {
      throw new Error('BnB bookings are not active for this unit');
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();

    if (checkInDate <= today) {
      throw new Error('Check-in date must be in the future');
    }

    if (checkOutDate <= checkInDate) {
      throw new Error('Check-out date must be after check-in date');
    }

    // Check availability
    if (!unit.checkBnbAvailability(checkIn, checkOut)) {
      throw new Error('Unit is not available for the selected dates');
    }

    // Validate guest count
    const totalGuests = (guest.adults || 1) + (guest.children || 0);
    if (totalGuests > unit.bnb.guestLimits.maxGuests) {
      throw new Error(`Unit can accommodate maximum ${unit.bnb.guestLimits.maxGuests} guests`);
    }

    // Validate minimum stay
    const nights = differenceInDays(checkOutDate, checkInDate);
    if (nights < unit.bnb.bookingRules.minimumStay) {
      throw new Error(`Minimum stay is ${unit.bnb.bookingRules.minimumStay} night(s)`);
    }

    // Validate maximum stay
    if (nights > unit.bnb.bookingRules.maximumStay) {
      throw new Error(`Maximum stay is ${unit.bnb.bookingRules.maximumStay} night(s)`);
    }

    // Calculate pricing
    const pricing = calculateBookingPrice(unit, checkIn, checkOut, totalGuests);

    // Create booking data
    const bookingData = {
      guest: {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        adults: guest.adults || 1,
        children: guest.children || 0,
        infants: guest.infants || 0
      },
      dates: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights
      },
      pricing,
      booking: {
        platform,
        status: 'confirmed',
        source: platform,
        bookedAt: new Date()
      },
      communication: {
        specialRequests,
        notes: []
      }
    };

    // Add booking to unit
    const booking = unit.addBnbBooking(bookingData);
    await unit.save({ session });

    // Update unit status if needed
    if (unit.status === 'available') {
      unit.status = 'reserved';
      await unit.save({ session });
    }

    // Update availability calendar
    await updateAvailabilityCalendar(unit, checkIn, checkOut, 'booked', session);

    // Update financial metrics
    await updateUnitFinancials(unitId, pricing.totalAmount, 'bnb', session);

    // Log booking activity
    await logBookingActivity(
      unitId,
      'booking_created',
      `New booking for ${guest.name}`,
      req.user?.id,
      session
    );

    await session.commitTransaction();

    // Send confirmation email (implement as needed)
    // await sendBookingConfirmation(booking);

    res.status(201).json({
      success: true,
      booking,
      message: 'Booking created successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating booking: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get bookings for a unit or property
 */
export const getBookings = async (req, res) => {
  try {
    const {
      unitId,
      propertyId,
      status,
      platform,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = {
      $or: [
        { type: 'bnb' },
        { 'usageConfig.primaryUse': 'bnb' }
      ]
    };

    if (unitId) filter._id = unitId;
    if (propertyId) filter.propertyId = propertyId;

    // Get units with bookings
    const units = await Unit.find(filter)
      .populate('propertyId', 'name address')
      .select('unitNumber bnb.currentBookings propertyId');

    // Extract and flatten bookings
    let allBookings = [];
    
    units.forEach(unit => {
      if (unit.bnb?.currentBookings) {
        unit.bnb.currentBookings.forEach(booking => {
          allBookings.push({
            ...booking.toObject(),
            unit: {
              id: unit._id,
              unitNumber: unit.unitNumber,
              property: unit.propertyId
            }
          });
        });
      }
    });

    // Apply filters
    if (status) {
      allBookings = allBookings.filter(booking => 
        booking.booking.status === status
      );
    }

    if (platform) {
      allBookings = allBookings.filter(booking => 
        booking.booking.platform === platform
      );
    }

    if (startDate || endDate) {
      allBookings = allBookings.filter(booking => {
        const checkIn = new Date(booking.dates.checkIn);
        const checkOut = new Date(booking.dates.checkOut);
        
        if (startDate && checkOut < new Date(startDate)) return false;
        if (endDate && checkIn > new Date(endDate)) return false;
        
        return true;
      });
    }

    // Sort by check-in date
    allBookings.sort((a, b) => 
      new Date(a.dates.checkIn) - new Date(b.dates.checkIn)
    );

    // Pagination
    const total = allBookings.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedBookings = allBookings.slice(skip, skip + parseInt(limit));

    res.json({
      bookings: paginatedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      summary: {
        total: allBookings.length,
        confirmed: allBookings.filter(b => b.booking.status === 'confirmed').length,
        checkedIn: allBookings.filter(b => b.booking.status === 'checked_in').length,
        checkedOut: allBookings.filter(b => b.booking.status === 'checked_out').length,
        cancelled: allBookings.filter(b => b.booking.status === 'cancelled').length
      }
    });

  } catch (error) {
    logger.error(`Error fetching bookings: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update booking status (check-in, check-out, cancel)
 */
export const updateBookingStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { unitId, bookingId } = req.params;
    const { status, notes } = req.body;

    if (!['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'].includes(status)) {
      throw new Error('Invalid booking status');
    }

    const unit = await Unit.findById(unitId).session(session);
    if (!unit) {
      throw new Error('Unit not found');
    }

    const booking = unit.bnb.currentBookings.id(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const previousStatus = booking.booking.status;
    booking.booking.status = status;

    // Add status change note
    if (notes) {
      booking.communication.notes.push({
        note: notes,
        date: new Date(),
        addedBy: req.user?.id
      });
    }

    // Handle status-specific logic
    switch (status) {
      case 'checked_in':
        if (previousStatus !== 'confirmed') {
          throw new Error('Can only check-in confirmed bookings');
        }
        unit.status = 'occupied';
        booking.actualCheckIn = new Date();
        break;

      case 'checked_out':
        if (previousStatus !== 'checked_in') {
          throw new Error('Can only check-out checked-in bookings');
        }
        unit.status = 'available'; // Will need cleaning
        booking.actualCheckOut = new Date();
        
        // Update availability calendar for future
        await updateAvailabilityCalendar(
          unit, 
          booking.dates.checkOut, 
          addDays(booking.dates.checkOut, 1), 
          'available', 
          session
        );
        break;

      case 'cancelled':
        // Free up the dates
        await updateAvailabilityCalendar(
          unit,
          booking.dates.checkIn,
          booking.dates.checkOut,
          'available',
          session
        );
        
        // Reverse financial impact if needed
        await updateUnitFinancials(
          unitId, 
          -booking.pricing.totalAmount, 
          'bnb', 
          session
        );
        break;
    }

    await unit.save({ session });

    // Log status change
    await logBookingActivity(
      unitId,
      `booking_${status}`,
      `Booking status changed from ${previousStatus} to ${status}`,
      req.user?.id,
      session
    );

    await session.commitTransaction();

    res.json({
      success: true,
      booking,
      message: `Booking ${status} successfully`
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating booking status: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get availability calendar for a unit
 */
export const getAvailabilityCalendar = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { year, month } = req.query;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    if (unit.type !== 'bnb' && unit.usageConfig?.primaryUse !== 'bnb') {
      return res.status(400).json({ error: 'Unit is not configured for BnB' });
    }

    // Generate calendar for the specified month/year
    const calendar = await generateCalendarView(unit, year, month);

    res.json({
      unit: {
        id: unit._id,
        unitNumber: unit.unitNumber,
        basePrice: unit.bnb.pricing.basePrice
      },
      calendar,
      summary: {
        totalDays: calendar.length,
        availableDays: calendar.filter(day => day.available).length,
        bookedDays: calendar.filter(day => day.status === 'booked').length,
        blockedDays: calendar.filter(day => day.status === 'blocked').length
      }
    });

  } catch (error) {
    logger.error(`Error fetching availability calendar: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Block/unblock dates manually
 */
export const updateAvailability = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { unitId } = req.params;
    const { startDate, endDate, available, reason, price } = req.body;

    const unit = await Unit.findById(unitId).session(session);
    if (!unit) {
      throw new Error('Unit not found');
    }

    await updateAvailabilityCalendar(
      unit,
      startDate,
      endDate,
      available ? 'available' : 'blocked',
      session,
      { reason, price }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `Availability updated for ${startDate} to ${endDate}`
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating availability: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get BnB performance metrics
 */
export const getBnBMetrics = async (req, res) => {
  try {
    const { unitId, propertyId, startDate, endDate } = req.query;

    const filter = {
      $or: [
        { type: 'bnb' },
        { 'usageConfig.primaryUse': 'bnb' }
      ],
      'bnb.isActive': true
    };

    if (unitId) filter._id = unitId;
    if (propertyId) filter.propertyId = propertyId;

    const units = await Unit.find(filter)
      .populate('propertyId', 'name');

    const metrics = await calculateBnBMetrics(units, startDate, endDate);

    res.json(metrics);

  } catch (error) {
    logger.error(`Error fetching BnB metrics: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Helper Functions

/**
 * Calculate booking price with all fees
 */
function calculateBookingPrice(unit, checkIn, checkOut, guestCount) {
  const nights = differenceInDays(new Date(checkOut), new Date(checkIn));
  const basePrice = unit.bnb.pricing.basePrice;
  
  // Calculate base amount
  let baseAmount = basePrice * nights;
  
  // Apply seasonal rates if applicable
  baseAmount = applySeasonalRates(unit, checkIn, checkOut, baseAmount);
  
  // Calculate fees
  const cleaningFee = unit.bnb.pricing.cleaningFee || 0;
  const extraGuests = Math.max(0, guestCount - 2);
  const extraGuestFees = extraGuests * (unit.bnb.pricing.extraGuestFee || 0);
  
  // Calculate taxes (implement based on local requirements)
  const taxRate = 0.16; // 16% VAT in Kenya
  const subtotal = baseAmount + cleaningFee + extraGuestFees;
  const taxes = subtotal * taxRate;
  
  const totalAmount = subtotal + taxes;

  return {
    baseAmount,
    cleaningFee,
    extraGuestFees,
    taxes,
    totalAmount,
    currency: unit.bnb.pricing.currency,
    breakdown: {
      pricePerNight: basePrice,
      nights,
      extraGuests,
      taxRate: taxRate * 100
    }
  };
}

/**
 * Apply seasonal rates to base amount
 */
function applySeasonalRates(unit, checkIn, checkOut, baseAmount) {
  const seasonalRates = unit.bnb.pricing.seasonalRates || [];
  
  if (seasonalRates.length === 0) return baseAmount;
  
  // Check if dates fall within any seasonal period
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  for (const rate of seasonalRates) {
    if (isWithinInterval(checkInDate, { 
      start: new Date(rate.startDate), 
      end: new Date(rate.endDate) 
    })) {
      return baseAmount * (rate.priceMultiplier || 1);
    }
  }
  
  return baseAmount;
}

/**
 * Update availability calendar
 */
async function updateAvailabilityCalendar(unit, startDate, endDate, status, session, options = {}) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Remove existing entries for the date range
  unit.bnb.availability = unit.bnb.availability.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate < start || entryDate >= end;
  });
  
  // Add new entries
  for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
    unit.bnb.availability.push({
      date: new Date(date),
      available: status === 'available',
      reason: status,
      price: options.price,
      notes: options.reason
    });
  }
  
  await unit.save({ session });
}

/**
 * Update unit financial metrics
 */
async function updateUnitFinancials(unitId, amount, type, session) {
  const updateFields = {};
  updateFields[`financials.currentMonth.${type}`] = amount;
  updateFields[`financials.yearToDate.${type}`] = amount;
  updateFields[`financials.lifetime.${type}`] = amount;
  updateFields['financials.lastUpdated'] = new Date();

  await Unit.findByIdAndUpdate(
    unitId,
    { $inc: updateFields },
    { session }
  );
}

/**
 * Log booking activity
 */
async function logBookingActivity(unitId, action, description, userId, session) {
  // Implement based on your activity logging system
  logger.info(`BnB Activity - Unit: ${unitId}, Action: ${action}, User: ${userId}, Description: ${description}`);
}

/**
 * Generate calendar view for a month
 */
async function generateCalendarView(unit, year, month) {
  const startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  const calendar = [];
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check availability entries
    const availabilityEntry = unit.bnb.availability.find(entry => 
      format(entry.date, 'yyyy-MM-dd') === dateStr
    );
    
    // Check bookings
    const booking = unit.bnb.currentBookings.find(booking =>
      booking.booking.status !== 'cancelled' &&
      date >= new Date(booking.dates.checkIn) &&
      date < new Date(booking.dates.checkOut)
    );
    
    calendar.push({
      date: dateStr,
      available: availabilityEntry ? availabilityEntry.available : !booking,
      status: booking ? 'booked' : (availabilityEntry?.reason || 'available'),
      price: availabilityEntry?.price || unit.bnb.pricing.basePrice,
      booking: booking ? {
        id: booking._id,
        guestName: booking.guest.name,
        platform: booking.booking.platform
      } : null,
      notes: availabilityEntry?.notes
    });
  }
  
  return calendar;
}

/**
 * Calculate comprehensive BnB metrics
 */
async function calculateBnBMetrics(units, startDate, endDate) {
  // Implement comprehensive metrics calculation
  // This is a placeholder for the actual implementation
  
  const totalUnits = units.length;
  let totalBookings = 0;
  let totalRevenue = 0;
  let totalNights = 0;
  
  units.forEach(unit => {
    if (unit.bnb?.currentBookings) {
      unit.bnb.currentBookings.forEach(booking => {
        if (booking.booking.status !== 'cancelled') {
          totalBookings++;
          totalRevenue += booking.pricing.totalAmount;
          totalNights += booking.dates.nights;
        }
      });
    }
  });
  
  return {
    totalUnits,
    totalBookings,
    totalRevenue,
    totalNights,
    averageNightlyRate: totalNights > 0 ? totalRevenue / totalNights : 0,
    averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
    currency: 'KES'
  };
}

export default {
  getBnBUnits,
  createBooking,
  getBookings,
  updateBookingStatus,
  getAvailabilityCalendar,
  updateAvailability,
  getBnBMetrics
};