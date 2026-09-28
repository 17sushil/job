import { Router } from 'express';
import { authMiddleware, requireRoles } from '../../middlewares/auth.middleware.js';
import { UserRole } from '../user/user.entity.js';
import { deleteJob, ingestJobs, listJobs } from './job.controller.js';

export const jobRoutes = Router();

jobRoutes.get('/', listJobs);
jobRoutes.post('/ingest', ingestJobs);
jobRoutes.delete(
  '/:id',
  authMiddleware,
  requireRoles(UserRole.ADMIN, UserRole.SUPERADMIN),
  deleteJob,
);
