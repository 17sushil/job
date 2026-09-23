import type { z } from 'zod';

import { AppError } from '../../common/errors/AppError.js';
import { AppDataSource } from '../../database/data-source.js';
import { Application, ApplicationStatus } from './application.entity.js';
import { Job, JobStatus } from './job.entity.js';
import type {
  createJobSchema,
  updateApplicationStatusSchema,
  updateJobSchema,
} from './recruiter.schema.js';

const jobRepo = () => AppDataSource.getRepository(Job);
const applicationRepo = () => AppDataSource.getRepository(Application);

/**
 * The strict hiring workflow, mirrored from the UI rules:
 * New -> Shortlisted or Rejected; Shortlisted -> Interview or Rejected;
 * after the interview -> Hire, Reject, or Reschedule (stay INTERVIEW with a
 * new interviewAt). Hired and Rejected are terminal.
 */
const ALLOWED_NEXT: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.NEW]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.INTERVIEW,
  ],
  [ApplicationStatus.HIRED]: [],
  [ApplicationStatus.REJECTED]: [],
};

export class RecruiterService {
  async createJob(recruiterId: string, data: z.infer<typeof createJobSchema>) {
    return jobRepo().save(
      jobRepo().create({
        ...data,
        recruiterId,
        salaryRange: data.salaryRange ?? null,
      }),
    );
  }

  async listMyJobs(recruiterId: string) {
    return jobRepo().find({
      where: { recruiterId },
      order: { createdAt: 'desc' },
    });
  }

  async listOpenJobs() {
    return jobRepo().find({
      where: { status: JobStatus.OPEN },
      order: { createdAt: 'desc' },
    });
  }

  async getJob(jobId: string) {
    const job = await jobRepo().findOneBy({ jobId });
    if (!job) throw new AppError(404, 'Job not found');
    return job;
  }

  private async getOwnedJob(recruiterId: string, jobId: string) {
    const job = await this.getJob(jobId);
    if (job.recruiterId !== recruiterId) {
      throw new AppError(403, 'You do not own this job');
    }
    return job;
  }

  async updateJob(
    recruiterId: string,
    jobId: string,
    data: z.infer<typeof updateJobSchema>,
  ) {
    const job = await this.getOwnedJob(recruiterId, jobId);
    if (data.status === JobStatus.PAUSED) job.pausedAt = new Date();
    if (data.status === JobStatus.CANCELLED) job.cancelledAt = new Date();
    if (data.status === JobStatus.OPEN) job.pausedAt = null;
    Object.assign(job, data);
    return jobRepo().save(job);
  }

  async deleteJob(recruiterId: string, jobId: string) {
    await this.getOwnedJob(recruiterId, jobId);
    await applicationRepo().delete({ jobId });
    await jobRepo().delete({ jobId });
    return { message: 'Job deleted' };
  }

  async apply(candidateId: string, jobId: string) {
    const job = await this.getJob(jobId);
    if (job.status !== JobStatus.OPEN) {
      throw new AppError(409, 'This job is not accepting applications');
    }
    const existing = await applicationRepo().findOneBy({
      jobId,
      candidateId,
    });
    if (existing) {
      throw new AppError(409, 'You have already applied to this job');
    }
    return applicationRepo().save(
      applicationRepo().create({ jobId, candidateId }),
    );
  }

  async listMyApplications(candidateId: string) {
    return applicationRepo().find({
      where: { candidateId },
      order: { createdAt: 'desc' },
    });
  }

  async listJobApplications(recruiterId: string, jobId: string) {
    await this.getOwnedJob(recruiterId, jobId);
    return applicationRepo().find({
      where: { jobId },
      order: { createdAt: 'desc' },
    });
  }

  async updateApplicationStatus(
    recruiterId: string,
    applicationId: string,
    data: z.infer<typeof updateApplicationStatusSchema>,
  ) {
    const application = await applicationRepo().findOneBy({ applicationId });
    if (!application) throw new AppError(404, 'Application not found');
    await this.getOwnedJob(recruiterId, application.jobId);

    if (!ALLOWED_NEXT[application.status].includes(data.status)) {
      throw new AppError(
        409,
        `Cannot move an application from ${application.status} to ${data.status}`,
      );
    }

    application.status = data.status;
    if (data.status === ApplicationStatus.INTERVIEW) {
      application.interviewAt = data.interviewAt
        ? new Date(data.interviewAt)
        : (application.interviewAt ?? new Date());
    }
    return applicationRepo().save(application);
  }
}
