import { Router } from 'express';
import { getCategories, createCategory, getCategoryById, updateCategory, deleteCategory, getCategoryTree } from '../controllers/categoryController';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '@mufar-commerce/shared';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.use(protect);

router.get('/tree', getCategoryTree);
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), validate({ body: createCategorySchema }), createCategory);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), validate({ body: updateCategorySchema }), updateCategory);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), deleteCategory);

export = router;
