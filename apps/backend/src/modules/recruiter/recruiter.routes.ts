import { Router } from 'express';

import {
  authMiddleware,
  requireRole,
} from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { UserRole } from '../user/user.entity.js';
import {
  applyToJob,
  createJob,
  deleteJob,
  getJob,
  listJobApplications,
  listMyApplications,
  listMyJobs,
  listOpenJobs,
  updateApplicationStatus,
  updateJob,
} from './recruiter.controller.js';
import {
  createJobSchema,
  updateApplicationStatusSchema,
  updateJobSchema,
} from './recruiter.schema.js';

const recruiterOnly = requireRole(
  UserRole.RECRUITER,
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
);

export const recruiterRoutes = Router();

// Jobs
recruiterRoutes.get('/jobs', listOpenJobs);
recruiterRoutes.post(
  '/jobs',
  authMiddleware,
  recruiterOnly,
  validate(createJobSchema),
  createJob,
);
recruiterRoutes.get('/jobs/me', authMiddleware, recruiterOnly, listMyJobs);
recruiterRoutes.get('/jobs/:jobId', getJob);
recruiterRoutes.patch(
  '/jobs/:jobId',
  authMiddleware,
  recruiterOnly,
  validate(updateJobSchema),
  updateJob,
);
recruiterRoutes.delete(
  '/jobs/:jobId',
  authMiddleware,
  recruiterOnly,
  deleteJob,
);

// Applications
recruiterRoutes.post(
  '/jobs/:jobId/apply',
  authMiddleware,
  applyToJob,
);
recruiterRoutes.get('/applications/me', authMiddleware, listMyApplications);
recruiterRoutes.get(
  '/jobs/:jobId/applications',
  authMiddleware,
  recruiterOnly,
  listJobApplications,
);
recruiterRoutes.patch(
  '/applications/:applicationId',
  authMiddleware,
  recruiterOnly,
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);
