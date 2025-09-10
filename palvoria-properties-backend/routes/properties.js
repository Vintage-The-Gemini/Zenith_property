import express from 'express';
import multer from 'multer';
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
  setPrimaryImage,
  getPropertyStats
} from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/auth.js';

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

// Public routes
router.get('/', getProperties);
router.get('/:id', getProperty);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.get('/admin/stats', authorize('admin'), getPropertyStats);

// Property management routes (admin, agent, or owner)
router.post(
  '/', 
  authorize('admin', 'agent', 'property_owner'),
  upload.array('images', 10), // Allow up to 10 images
  createProperty
);

router.put(
  '/:id',
  authorize('admin', 'agent', 'property_owner'),
  upload.array('images', 10),
  updateProperty
);

router.delete(
  '/:id',
  authorize('admin', 'agent', 'property_owner'),
  deleteProperty
);

// Image management routes
router.delete(
  '/:id/images/:imageId',
  authorize('admin', 'agent', 'property_owner'),
  deletePropertyImage
);

router.put(
  '/:id/images/:imageId/primary',
  authorize('admin', 'agent', 'property_owner'),
  setPrimaryImage
);

export default router;