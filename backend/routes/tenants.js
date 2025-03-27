// routes/tenants.js
import express from 'express';
import { getTenants, getTenant, createTenant, updateTenant, endTenancy, recordPayment } from '../controllers/tenantController.js';
import auth from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(auth);

router.get('/', getTenants);
router.get('/:id', getTenant);
router.post('/', createTenant);
router.put('/:id', upload.array('documents'), updateTenant);
router.post('/:id/end-tenancy', endTenancy);
router.post('/:id/payments', recordPayment);

export default router;