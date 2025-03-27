// routes/units.js
import express from 'express';
import { 
  getUnits, 
  getUnit, 
  createUnit, 
  updateUnit, 
  addMaintenanceRecord, 
  updateUnitStatus 
} from '../controllers/unitController.js';
import auth from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(auth);

router.get('/', getUnits);
router.get('/:id', getUnit);
router.post('/', createUnit);
router.put('/:id', upload.array('images'), updateUnit);
router.post('/:id/maintenance', addMaintenanceRecord);
router.put('/:id/status', updateUnitStatus);

export default router;