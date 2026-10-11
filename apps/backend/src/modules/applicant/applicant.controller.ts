import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../../common/errors/AppError.js';
import { UserRole } from '../user/user.entity.js';
import { UserRepository } from '../user/user.repository.js';
import { JobRepository } from '../job/job.repository.js';
import { ApplicationRepository } from '../application/application.repository.js';
import { toApplicantPayload, type ApplicantPayload } from './applicant.serializer.js';
import { renderApplicantPdf } from './resume-pdf.js';

const users = new UserRepository();
const jobs = new JobRepository();
const applications = new ApplicationRepository();
const idSchema = z.string().uuid('Invalid applicant or job id');
type Viewer = { userId: string; role: UserRole };
const isAdmin = (viewer: Viewer) => viewer.role === UserRole.ADMIN || viewer.role === UserRole.SUPERADMIN;

/** Application-specific routes never reveal another recruiter's application. */
async function loadForViewer(id: unknown, viewer: Viewer) {
  const application = await applications.findById(idSchema.parse(id));
  if (!application) throw new AppError(404, 'Applicant not found');
  const job = await jobs.findById(application.jobId);
  if (!job || job.isDeleted || (!isAdmin(viewer) && job.postedBy !== viewer.userId)) throw new AppError(404, 'Applicant not found');
  const candidate = await users.findResumeProfile(application.candidateId);
  if (!candidate || candidate.isDeleted || candidate.role !== UserRole.CANDIDATE) throw new AppError(404, 'Applicant not found');
  return { application, job, candidate };
}

/** Own applications plus the pre-existing, uncapped anonymized candidate directory.
 * A candidate-only row contains no other recruiter's application/job/status. */
export async function applicantRows(viewer: Viewer, jobFilter?: string): Promise<ApplicantPayload[]> {
  const mine = isAdmin(viewer) ? await jobs.findOpen() : await jobs.findByPostedBy(viewer.userId);
  if (jobFilter && !mine.some(job => job.id === idSchema.parse(jobFilter))) throw new AppError(404, 'Job not found');
  const selectedJobs = jobFilter ? mine.filter(job => job.id === jobFilter) : mine;
  const jobMap = new Map(selectedJobs.filter(job => !job.isDeleted).map(job => [job.id, job]));
  const [found, candidates] = await Promise.all([
    applications.findByJobIds([...jobMap.keys()]), users.findByRole(UserRole.CANDIDATE),
  ]);
  const candidateMap = new Map(candidates.map(candidate => [candidate.userId, candidate]));
  const applied = new Set<string>();
  const rows: ApplicantPayload[] = [];
  for (const application of found) {
    const candidate = candidateMap.get(application.candidateId);
    const job = jobMap.get(application.jobId);
    if (!candidate || !job) continue;
    applied.add(candidate.userId);
    rows.push(toApplicantPayload(application, candidate, job));
  }
  if (!jobFilter) for (const candidate of candidates) {
    if (!applied.has(candidate.userId)) rows.push(toApplicantPayload(null, candidate, null));
  }
  return rows;
}

export const listApplicants: RequestHandler = async (req, res, next) => {
  try {
    const filter = req.query.jobId === undefined ? undefined : idSchema.parse(req.query.jobId);
    const applicants = await applicantRows(req.user!, filter);
    res.json({ success: true, data: { applicants, total: applicants.length } });
  } catch (error) { next(error); }
};

export const getApplicant: RequestHandler = async (req, res, next) => {
  try {
    const { application, job, candidate } = await loadForViewer(req.params.id, req.user!);
    res.json({ success: true, data: { applicant: toApplicantPayload(application, candidate, job) } });
  } catch (error) { next(error); }
};

export const getApplicantResume: RequestHandler = async (req, res, next) => {
  try {
    const { application, job, candidate } = await loadForViewer(req.params.id, req.user!);
    const payload = toApplicantPayload(application, candidate, job);
    res.json({ success: true, data: { applicantId: payload.id, candidateName: payload.candidate.name,
      fileName: payload.candidate.resumeFileName, contactMode: payload.candidate.contactMode,
      contact: payload.candidate.contact, resume: payload.candidate.resume } });
  } catch (error) { next(error); }
};

export const getApplicantResumePdf: RequestHandler = async (req, res, next) => {
  try {
    const { application, job, candidate } = await loadForViewer(req.params.id, req.user!);
    if (!candidate.resumeFileName && !candidate.parsedProfile && !candidate.resumeCanvas) throw new AppError(404, 'No resume available');
    const bytes = await renderApplicantPdf(toApplicantPayload(application, candidate, job), 'Recruiter view');
    res.setHeader('Content-Disposition', 'inline; filename="JobDev-candidate-resume.pdf"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.type('application/pdf').send(Buffer.from(bytes));
  } catch (error) { next(error); }
};
