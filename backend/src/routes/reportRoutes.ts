import { Router } from 'express';
import { getSalesReport, getInventoryReport, getCustomerReport, exportReport } from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER));

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/customers', getCustomerReport);
router.get('/export', exportReport);

export = router;
