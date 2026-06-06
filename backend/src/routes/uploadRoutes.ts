import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadImages } from '../controllers/uploadController';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.post('/', protect, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), upload.array('images', 5), uploadImages);

export default router;
