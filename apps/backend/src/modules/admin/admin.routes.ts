import { Router } from 'express';

import {
  authMiddleware,
  requireRole,
} from '../../middlewares/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';
import {
  createUser,
  deleteJob,
  deleteUser,
  listApplications,
  listJobs,
  listUsers,
  stats,
  updateUser,
} from './admin.controller.js';
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
} from './admin.schema.js';
import { validate } from '../../middlewares/validate.js';

/**
 * Admin surface. Strictly ADMIN / SUPERADMIN; every other signed-in role
 * gets 403 and anonymous requests get 401. The role hierarchy (who may
 * manage whom) is enforced inside the controller.
 */
export const adminRoutes = Router();

adminRoutes.use(
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.SUPERADMIN),
);

adminRoutes.get('/stats', stats);
adminRoutes.get('/users', listUsers);
adminRoutes.post('/users', validate(adminCreateUserSchema), createUser);
adminRoutes.patch(
  '/users/:id',
  validate(adminUpdateUserSchema),
  updateUser,
);
adminRoutes.delete('/users/:id', deleteUser);
adminRoutes.get('/jobs', listJobs);
adminRoutes.delete('/jobs/:id', deleteJob);
adminRoutes.get('/applications', listApplications);
