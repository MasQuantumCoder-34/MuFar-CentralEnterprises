import { Router } from 'express';
import { getCart, addCartItem, updateCartItem, removeCartItem, clearCart } from '../controllers/cartController';
import { protect } from '../middleware/auth';
import validate from '../middleware/validate';
import { z } from 'zod';

const router = Router();

router.use(protect);

const addCartSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive().default(1),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be 0 or more'),
});

router.get('/', getCart);
router.post('/items', validate({ body: addCartSchema }), addCartItem);
router.put('/items/:productId', validate({ body: updateCartSchema }), updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

export = router;
