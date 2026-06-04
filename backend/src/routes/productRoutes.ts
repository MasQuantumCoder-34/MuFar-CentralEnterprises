import { Router } from 'express';
import { getProducts, createProduct, getProductById, updateProduct, deleteProduct, toggleProductStatus, uploadProductImages, getLowStockProducts, searchProducts } from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '@mufar-commerce/shared';
import { UserRole } from '@mufar-commerce/shared';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

router.get('/search', searchProducts);
router.get('/low-stock', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), getLowStockProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), validate({ body: createProductSchema }), createProduct);
router.put('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), validate({ body: updateProductSchema }), updateProduct);
router.delete('/:id', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), deleteProduct);
router.put('/:id/toggle-status', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN), toggleProductStatus);
router.post('/:id/images', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), upload.array('images', 5), uploadProductImages);

export = router;
