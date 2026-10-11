import { Router } from 'express';
import { z } from 'zod';
import type { RequestHandler } from 'express';
import { authMiddleware, requireRoles } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { AppError } from '../../common/errors/AppError.js';
import { applicantRows } from '../applicant/applicant.controller.js';
import { UserRole } from '../user/user.entity.js';
import { JobRepository } from '../job/job.repository.js';
import { ApplicationRepository } from './application.repository.js';


import { AppDataSource } from '../../database/data-source.js';
import { Application } from './application.entity.js';
import { Job } from '../job/job.entity.js';

// Compatibility route: same protected source as /api/applicants, never raw CVs.
const listRecruiterApplicants: RequestHandler = async (req, res, next) => {
  try {
    const rows = await applicantRows(req.user!);
    const applicants = rows.map(row => ({
      id: row.id, candidateId: row.candidate.id, kind: row.kind,
      name: row.candidate.name, email: row.candidate.contact.email.token ?? '', phone: row.candidate.contact.phone.token ?? '',
      contact: row.candidate.contact, contactMasked: true, location: row.candidate.location ?? '',
      summary: row.candidate.resume.summary, skills: row.candidate.resume.skills,
      experience: row.candidate.resume.experience, education: row.candidate.resume.education.join(' · '),
      jobId: row.job?.id ?? null, job: row.job?.title ?? 'Available candidate',
      status: row.status, match: row.match, matchScore: row.match,
      appliedAt: row.appliedAt, appliedDaysAgo: row.appliedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(row.appliedAt)) / 86400000)) : 0,
      resumeUrl: row.candidate.hasResume ? `/api/candidates/${row.candidate.id}/resume` : undefined,
    }));
    res.json({ success: true, data: { applicants } });
  } catch (error) { next(error); }
};

export const applySchema = z.object({
  jobId: z.string().uuid('Invalid job id'),
});

const applicationRepo = new ApplicationRepository();
const jobRepo = new JobRepository();

const listMyApplications: RequestHandler = async (req, res, next) => {
  try {
    const applications = await AppDataSource.getRepository(Application)
      .createQueryBuilder('application')
      .leftJoinAndMapOne('application.job', Job, 'job', 'job.id = application.jobId')
      .where('application.candidateId = :id', { id: req.user!.userId })
      .orderBy('application.createdAt', 'DESC').getMany() as Array<Application & { job: Job | null }>;

    res.json({
      success: true,
      data: {
        applications: applications.map((application) => ({
          id: application.applicationId,
          status: application.status,
          createdAt: application.createdAt,
          job: application.job ?? null,
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

// Global auth removed in favor of route-specific roles

applicationRoutes.get('/', authMiddleware, requireRoles(UserRole.CANDIDATE), listMyApplications);
applicationRoutes.get('/recruiter', authMiddleware, requireRoles(UserRole.RECRUITER), listRecruiterApplicants);
applicationRoutes.post('/', authMiddleware, requireRoles(UserRole.CANDIDATE), validate(applySchema), applyToJob);
