import { Router } from 'express';
import { getUsers, createUser, getUserById, updateUser, deleteUser, toggleUserStatus } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import validate from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '@mufar-commerce/shared';
import { UserRole } from '@mufar-commerce/shared';

const router = Router();

router.use(protect);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN));

router.get('/', getUsers);
router.post('/', validate({ body: createUserSchema }), createUser);
router.get('/:id', getUserById);
router.put('/:id', validate({ body: updateUserSchema }), updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/toggle-status', toggleUserStatus);

export = router;
