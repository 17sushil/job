import { z } from 'zod';

import { ApplicationStatus } from './application.entity.js';
import { JobStatus, JobType } from './job.entity.js';

export const createJobSchema = z.object({
  title: z.string().trim().min(3),
  company: z.string().trim().min(2),
  description: z.string().trim().min(10),
  location: z.string().trim().min(2),
  type: z.nativeEnum(JobType).optional(),
  salaryRange: z.string().optional(),
});

export const updateJobSchema = z.object({
  title: z.string().trim().min(3).optional(),
  company: z.string().trim().min(2).optional(),
  description: z.string().trim().min(10).optional(),
  location: z.string().trim().min(2).optional(),
  type: z.nativeEnum(JobType).optional(),
  salaryRange: z.string().optional(),
  status: z.nativeEnum(JobStatus).optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  /** ISO datetime; required when scheduling or rescheduling an interview. */
  interviewAt: z.string().datetime().optional(),
});
