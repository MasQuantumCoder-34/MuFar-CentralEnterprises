import { Router } from 'express';
import { getSettingsController, updateSettings, uploadLogo } from '../controllers/settingsController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '@mufar-commerce/shared';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', getSettingsController);
router.put('/', updateSettings);
router.post('/logo', upload.single('logo'), uploadLogo);

export = router;
