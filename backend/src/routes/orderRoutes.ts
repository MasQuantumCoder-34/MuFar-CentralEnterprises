import { Router } from 'express';
import { getOrders, createOrder, getOrderById, updateOrderStatus, getMyOrders, getOrderInvoice, getOrderTracking, cancelOrder } from '../controllers/orderController';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '@mufar-commerce/shared';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.use(protect);

router.get('/my-orders', getMyOrders);
router.get('/', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), getOrders);
router.post('/', validate({ body: createOrderSchema }), createOrder);
router.get('/:id', getOrderById);
router.get('/:id/invoice', getOrderInvoice);
router.get('/:id/tracking', getOrderTracking);
router.put('/:id/status', authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), validate({ body: updateOrderStatusSchema }), updateOrderStatus);
router.post('/:id/cancel', cancelOrder);

export = router;
