// routes/properties.js
import express from 'express';
import { 
  getProperties, 
  getProperty, 
  createProperty, 
  updateProperty, 
  deleteProperty,
  getPublicProperties 
} from '../controllers/propertyController.js';
import auth from '../middleware/auth.js';
import { checkRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getPublicProperties);

// Protected routes (authentication required)
router.use(auth); // Apply authentication to all routes below

router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', checkRole(['owner', 'admin']), createProperty);
router.put('/:id', checkRole(['owner', 'admin']), updateProperty);
router.delete('/:id', checkRole(['owner', 'admin']), deleteProperty);

export default router;