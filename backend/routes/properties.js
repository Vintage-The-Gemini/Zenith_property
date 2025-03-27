// routes/properties.js
import express from 'express';
import { 
  getProperties, 
  getProperty, 
  createProperty, 
  updateProperty, 
  deleteProperty 
} from '../controllers/propertyController.js';
import auth from '../middleware/auth.js';
import { checkRole } from '../middleware/auth.js';

const router = express.Router();

router.use(auth); // Apply authentication to all routes

router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', checkRole(['owner', 'admin']), createProperty);
router.put('/:id', checkRole(['owner', 'admin']), updateProperty);
router.delete('/:id', checkRole(['owner', 'admin']), deleteProperty);

export default router;