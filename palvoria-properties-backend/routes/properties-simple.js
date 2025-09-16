import express from 'express';
import multer from 'multer';
import Property from '../models/Property.js';
import { 
  uploadPropertyMainImage, 
  uploadPropertyGalleryImage, 
  uploadPropertyDocument,
  deletePropertyAsset,
  deletePropertyFolder
} from '../config/cloudinary.js';
import mongoose from 'mongoose';

const router = express.Router();

// Configure multer for image uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @desc    Get all properties with filtering, sorting, and pagination
// @route   GET /api/properties
// @access  Public (simplified for now)
export const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100; // Increased from 10 to 100 for admin access
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Status filter (default to active for public, all for admin)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Property type filter
    if (req.query.propertyType) {
      filter.propertyType = req.query.propertyType;
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Off-plan filter
    if (req.query.isOffPlan) {
      filter.isOffPlan = req.query.isOffPlan === 'true';
    }

    // Location filters
    if (req.query.city) {
      filter['location.city'] = new RegExp(req.query.city, 'i');
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter['price.amount'] = {};
      if (req.query.minPrice) filter['price.amount'].$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter['price.amount'].$lte = parseFloat(req.query.maxPrice);
    }

    // Text search
    if (req.query.search) {
      filter.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { 'location.address': new RegExp(req.query.search, 'i') }
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
    const property = await Property.findById(req.params.id);

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
// @access  Public (simplified for now)
export const createProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Backend - Received request body:', req.body);
    
    // Create a simple owner ID for now (in production, use real user authentication)
    const dummyOwnerId = '507f1f77bcf86cd799439011';
    
    const propertyData = {
      ...req.body,
      owner: dummyOwnerId,
      images: [],
      documents: []
    };
    
    console.log('Backend - Property data before parsing:', propertyData);

    // Parse JSON fields that come as strings from FormData
    ['location', 'features', 'amenities', 'price', 'offPlanDetails', 'seo'].forEach(field => {
      if (typeof propertyData[field] === 'string') {
        try {
          propertyData[field] = JSON.parse(propertyData[field]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });

    // Create property
    const property = new Property(propertyData);
    await property.save({ session });

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      try {
        console.log(`📸 Uploading ${req.files.length} images for property ${property._id}`);
        const primaryImageIndex = parseInt(req.body.primaryImageIndex) || 0;
        const uploadPromises = req.files.map(async (file, index) => {
          const result = await uploadPropertyGalleryImage(
            file.buffer, 
            file.originalname, 
            property._id.toString()
          );
          
          return {
            url: result.secure_url,
            publicId: result.public_id,
            caption: '',
            isPrimary: index === primaryImageIndex,
            order: index // Add order field to maintain sequence
          };
        });

        property.images = await Promise.all(uploadPromises);
        await property.save({ session });
        console.log(`✅ Successfully uploaded ${property.images.length} images`);
      } catch (imageError) {
        console.error('Image upload error:', imageError);
        // Continue without images rather than failing the entire property creation
        console.log('⚠️ Property created without images due to upload error');
      }
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: property,
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
// @access  Public (simplified for now)
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

    // Parse JSON fields that come as strings from FormData
    const updateData = { ...req.body };
    ['location', 'features', 'amenities', 'price', 'seo', 'offPlanDetails'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });

    // Remove undefined or problematic fields
    if (updateData.images === undefined || updateData.images === 'undefined') {
      delete updateData.images;
    }
    if (updateData.primaryImageIndex === undefined || updateData.primaryImageIndex === 'undefined') {
      delete updateData.primaryImageIndex;
    }

    // Update property data (excluding images which will be handled separately)
    Object.keys(updateData).forEach(key => {
      if (key !== 'images' && key !== 'primaryImageIndex') {
        property[key] = updateData[key];
      }
    });

    // Handle image updates
    const existingImagesData = updateData.existingImages ? JSON.parse(updateData.existingImages) : [];
    const primaryImageIndex = parseInt(updateData.primaryImageIndex) || 0;
    
    // Start with existing images that were kept
    let finalImages = [...existingImagesData];
    
    // Upload new images if present
    if (req.files && req.files.length > 0) {
      console.log(`📸 Uploading ${req.files.length} new images for property ${property._id}`);
      
      const uploadPromises = req.files.map(async (file, index) => {
        const result = await uploadPropertyGalleryImage(
          file.buffer, 
          file.originalname, 
          property._id.toString()
        );
        
        return {
          url: result.secure_url,
          publicId: result.public_id,
          caption: '',
          isPrimary: false, // Will be set below based on overall index
          order: existingImagesData.length + index
        };
      });

      const newUploadedImages = await Promise.all(uploadPromises);
      finalImages = [...finalImages, ...newUploadedImages];
      console.log(`✅ Successfully uploaded ${newUploadedImages.length} new images`);
    }
    
    // Set primary image based on overall index
    finalImages = finalImages.map((img, index) => ({
      ...img,
      isPrimary: index === primaryImageIndex,
      order: index
    }));
    
    // Delete removed images from Cloudinary
    if (property.images && property.images.length > 0) {
      const keptImageIds = finalImages.map(img => img.publicId).filter(Boolean);
      const imagesToDelete = property.images.filter(img => img.publicId && !keptImageIds.includes(img.publicId));
      
      if (imagesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${imagesToDelete.length} removed images from Cloudinary`);
        const deletePromises = imagesToDelete.map(async (image) => {
          try {
            await deletePropertyAsset(image.publicId);
          } catch (error) {
            console.warn('Failed to delete image:', image.publicId, error.message);
          }
        });
        await Promise.allSettled(deletePromises);
      }
    }
    
    property.images = finalImages;

    await property.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      data: property,
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
// @access  Public (simplified for now)
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

    // Delete all Cloudinary assets for this property (if any exist)
    try {
      await deletePropertyFolder(property._id.toString());
    } catch (cloudinaryError) {
      console.warn('Cloudinary cleanup failed (property may have no images):', cloudinaryError.message);
      // Continue with deletion even if Cloudinary cleanup fails
    }

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

// @desc    Update property image order and primary selection
// @route   PUT /api/properties/:id/images/reorder
// @access  Public (simplified for now)
export const reorderPropertyImages = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    const { imageOrder, primaryImageIndex } = req.body;

    if (imageOrder && Array.isArray(imageOrder)) {
      // Reorder images based on the provided order
      const reorderedImages = imageOrder.map((originalIndex, newIndex) => {
        const image = property.images[originalIndex];
        if (image) {
          return {
            ...image.toObject(),
            order: newIndex,
            isPrimary: newIndex === primaryImageIndex
          };
        }
        return null;
      }).filter(Boolean);

      property.images = reorderedImages;
      await property.save();

      res.json({
        success: true,
        data: property,
        message: 'Image order updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid image order data'
      });
    }

  } catch (error) {
    console.error('Reorder images error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reordering images'
    });
  }
};

// Routes
router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', upload.array('images'), createProperty); // No image limit
router.put('/:id', upload.array('images'), updateProperty); // No image limit
router.put('/:id/images/reorder', reorderPropertyImages); // Reorder images without upload
router.delete('/:id', deleteProperty);

export default router;