import Property from '../models/Property.js';
import { 
  uploadPropertyMainImage, 
  uploadPropertyGalleryImage, 
  uploadPropertyDocument,
  deletePropertyAsset,
  deletePropertyFolder
} from '../config/cloudinary.js';
import mongoose from 'mongoose';

// @desc    Get all properties with filtering, sorting, and pagination
// @route   GET /api/properties
// @access  Public
export const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Status filter (default to active for public, all for admin)
    if (req.query.status) {
      filter.status = req.query.status;
    } else if (!req.user || req.user.role !== 'admin') {
      filter.status = 'active';
    }

    // Property type filter
    if (req.query.propertyType) {
      filter.propertyType = req.query.propertyType;
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Location filters
    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city, 'i');
    }
    if (req.query.county) {
      filter['location.county'] = new RegExp(req.query.county, 'i');
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter['price.amount'] = {};
      if (req.query.minPrice) filter['price.amount'].$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter['price.amount'].$lte = parseFloat(req.query.maxPrice);
    }

    // Bedrooms filter
    if (req.query.bedrooms) {
      filter['features.bedrooms'] = parseInt(req.query.bedrooms);
    }

    // Featured filter
    if (req.query.featured === 'true') {
      filter.featured = true;
    }

    // Text search
    if (req.query.search) {
      filter.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { 'location.address': new RegExp(req.query.search, 'i') },
        { 'location.neighborhood': new RegExp(req.query.search, 'i') }
      ];
    }

    // Build sort object
    let sort = { createdAt: -1 }; // Default sort
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      switch (sortBy) {
        case 'price':
          sort = { 'price.amount': sortOrder };
          break;
        case 'date':
          sort = { createdAt: sortOrder };
          break;
        case 'views':
          sort = { views: sortOrder };
          break;
        case 'title':
          sort = { title: sortOrder };
          break;
        default:
          sort = { createdAt: -1 };
      }
    }

    const properties = await Property.find(filter)
      .populate('owner', 'name email phone')
      .populate('agent', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Property.countDocuments(filter);

    res.json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching properties'
    });
  }
};

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
export const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('agent', 'name email phone')
      .populate('inquiries.user', 'name email');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Increment view count (but don't wait for it)
    property.incrementViews().catch(err => console.error('View count error:', err));

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error('Get property error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching property'
    });
  }
};

// @desc    Create new property
// @route   POST /api/properties
// @access  Private (Admin/Agent)
export const createProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const propertyData = {
      ...req.body,
      owner: req.user.id,
      images: [],
      documents: []
    };

    // Create property
    const property = new Property(propertyData);
    await property.save({ session });

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file, index) => {
        const imageType = index === 0 ? 'main' : 'gallery';
        const result = await uploadPropertyGalleryImage(
          file.buffer, 
          file.originalname, 
          property._id.toString()
        );
        
        return {
          url: result.secure_url,
          publicId: result.public_id,
          caption: '',
          isPrimary: index === 0
        };
      });

      property.images = await Promise.all(uploadPromises);
      await property.save({ session });
    }

    await session.commitTransaction();

    // Populate and return
    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone')
      .populate('agent', 'name email phone');

    res.status(201).json({
      success: true,
      data: populatedProperty,
      message: 'Property created successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Create property error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating property'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Admin/Owner)
export const updateProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership (admin can update any, others only their own)
    if (req.user.role !== 'admin' && property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this property'
      });
    }

    // Update property data
    Object.assign(property, req.body);

    // Handle new image uploads if present
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const result = await uploadPropertyGalleryImage(
          file.buffer, 
          file.originalname, 
          property._id.toString()
        );
        
        return {
          url: result.secure_url,
          publicId: result.public_id,
          caption: '',
          isPrimary: property.images.length === 0 // First image is primary if no images exist
        };
      });

      const newImages = await Promise.all(uploadPromises);
      property.images.push(...newImages);
    }

    await property.save({ session });
    await session.commitTransaction();

    // Populate and return
    const populatedProperty = await Property.findById(property._id)
      .populate('owner', 'name email phone')
      .populate('agent', 'name email phone');

    res.json({
      success: true,
      data: populatedProperty,
      message: 'Property updated successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Update property error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating property'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Admin/Owner)
export const deleteProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership (admin can delete any, others only their own)
    if (req.user.role !== 'admin' && property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this property'
      });
    }

    // Delete all Cloudinary assets for this property
    await deletePropertyFolder(property._id.toString());

    // Delete the property
    await Property.findByIdAndDelete(req.params.id, { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Delete property error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting property'
    });
  } finally {
    session.endSession();
  }
};

// @desc    Delete property image
// @route   DELETE /api/properties/:id/images/:imageId
// @access  Private (Admin/Owner)
export const deletePropertyImage = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this property'
      });
    }

    const imageIndex = property.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = property.images[imageIndex];
    
    // Delete from Cloudinary
    await deletePropertyAsset(image.publicId);

    // Remove from property
    property.images.splice(imageIndex, 1);

    // If deleted image was primary and there are other images, make first one primary
    if (image.isPrimary && property.images.length > 0) {
      property.images[0].isPrimary = true;
    }

    await property.save();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image'
    });
  }
};

// @desc    Set primary image
// @route   PUT /api/properties/:id/images/:imageId/primary
// @access  Private (Admin/Owner)
export const setPrimaryImage = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && property.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this property'
      });
    }

    const imageIndex = property.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Reset all images to non-primary
    property.images.forEach(img => img.isPrimary = false);
    
    // Set selected image as primary
    property.images[imageIndex].isPrimary = true;

    await property.save();

    res.json({
      success: true,
      message: 'Primary image updated successfully'
    });

  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while setting primary image'
    });
  }
};

// @desc    Get property statistics (for admin dashboard)
// @route   GET /api/properties/stats
// @access  Private (Admin)
export const getPropertyStats = async (req, res) => {
  try {
    const stats = await Property.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          sold: {
            $sum: {
              $cond: [{ $eq: ['$status', 'sold'] }, 1, 0]
            }
          },
          rented: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rented'] }, 1, 0]
            }
          },
          draft: {
            $sum: {
              $cond: [{ $eq: ['$status', 'draft'] }, 1, 0]
            }
          },
          totalViews: { $sum: '$views' },
          avgPrice: { $avg: '$price.amount' }
        }
      }
    ]);

    const propertyTypeStats = await Property.aggregate([
      {
        $group: {
          _id: '$propertyType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const locationStats = await Property.aggregate([
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          active: 0,
          sold: 0,
          rented: 0,
          draft: 0,
          totalViews: 0,
          avgPrice: 0
        },
        propertyTypes: propertyTypeStats,
        topLocations: locationStats
      }
    });

  } catch (error) {
    console.error('Property stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
};