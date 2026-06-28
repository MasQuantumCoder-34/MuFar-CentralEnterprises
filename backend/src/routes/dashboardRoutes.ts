import { Router } from 'express';
import { getAdminDashboard, getClientDashboard, getRevenueTrend, getOrderTrend } from '../controllers/dashboardController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.use(protect);

router.get('/admin', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), getAdminDashboard);
router.get('/client', getClientDashboard);
router.get('/revenue-trend', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), getRevenueTrend);
router.get('/order-trend', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), getOrderTrend);

export = router;
