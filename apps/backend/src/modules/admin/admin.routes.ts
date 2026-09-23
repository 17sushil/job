import { Router } from 'express';

import {
  authMiddleware,
  requireRole,
} from '../../middlewares/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';
import { deleteUser, listUsers } from './admin.controller.js';

/**
 * Admin surface. Strictly ADMIN / SUPERADMIN; every other signed-in role
 * gets 403 and anonymous requests get 401.
 */
export const adminRoutes = Router();

adminRoutes.use(
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
);

adminRoutes.get('/users', listUsers);
adminRoutes.delete('/users/:id', deleteUser);
