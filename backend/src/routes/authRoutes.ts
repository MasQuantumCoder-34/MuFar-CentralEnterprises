import { Router } from 'express';
import { login, refresh, logout, changePassword, forgotPassword, resetPassword, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import validate from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '@mufar-commerce/shared';

const router = Router();

router.post('/login', validate({ body: loginSchema }), login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.post('/change-password', protect, validate({ body: changePasswordSchema }), changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

export = router;
