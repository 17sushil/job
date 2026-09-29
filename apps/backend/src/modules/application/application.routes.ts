import { Router } from 'express';
import { z } from 'zod';
import type { RequestHandler } from 'express';
import { authMiddleware, requireRoles } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { AppError } from '../../common/errors/AppError.js';
import { UserRole } from '../user/user.entity.js';
import { JobRepository } from '../job/job.repository.js';
import { ApplicationRepository } from './application.repository.js';

export const applySchema = z.object({
  jobId: z.string().uuid('Invalid job id'),
});

const applicationRepo = new ApplicationRepository();
const jobRepo = new JobRepository();

const listMyApplications: RequestHandler = async (req, res, next) => {
  try {
    const applications = await applicationRepo.findByCandidate(req.user!.userId);
    const jobs = await Promise.all(
      applications.map((application) => jobRepo.findById(application.jobId)),
    );

    res.json({
      success: true,
      data: {
        applications: applications.map((application, index) => ({
          id: application.applicationId,
          status: application.status,
          createdAt: application.createdAt,
          job: jobs[index] ?? null,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

const applyToJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await jobRepo.findById(req.body.jobId as string);
    if (!job || job.isDeleted) {
      throw new AppError(404, 'Job not found');
    }

    const existing = await applicationRepo.findByJobAndCandidate(
      job.id,
      req.user!.userId,
    );
    if (existing) {
      throw new AppError(409, 'You have already applied to this job');
    }

    const application = await applicationRepo.create({
      jobId: job.id,
      candidateId: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      data: { application: { id: application.applicationId, status: application.status } },
    });
  } catch (error) {
    next(error);
  }
};

export const applicationRoutes = Router();

applicationRoutes.use(authMiddleware, requireRoles(UserRole.CANDIDATE));

applicationRoutes.get('/', listMyApplications);
applicationRoutes.post('/', validate(applySchema), applyToJob);
