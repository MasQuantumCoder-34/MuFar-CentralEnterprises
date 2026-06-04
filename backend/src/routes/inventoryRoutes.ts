import { Router } from 'express';
import { getInventoryLogs, adjustStock } from '../controllers/inventoryController';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import { stockAdjustmentSchema } from '@mufar-commerce/shared';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/logs', getInventoryLogs);
router.post('/adjust', validate({ body: stockAdjustmentSchema }), adjustStock);

export = router;
