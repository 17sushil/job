import type { RequestHandler } from 'express';

import { AppError } from '../../common/errors/AppError.js';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { RecruiterService } from './recruiter.service.js';

const recruiterService = new RecruiterService();

function requireUser(req: AuthRequest) {
  if (!req.user) throw new AppError(401, 'Authentication required');
  return req.user;
}

export const createJob: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const job = await recruiterService.createJob(user.userId, req.body);
    res.status(201).json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
};

export const listMyJobs: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const jobs = await recruiterService.listMyJobs(user.userId);
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};

export const listOpenJobs: RequestHandler = async (_req, res, next) => {
  try {
    const jobs = await recruiterService.listOpenJobs();
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};

export const getJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await recruiterService.getJob((req.params.jobId as string));
    res.json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
};

export const updateJob: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const job = await recruiterService.updateJob(
      user.userId,
      (req.params.jobId as string),
      req.body,
    );
    res.json({ success: true, data: { job } });
  } catch (error) {
    next(error);
  }
};

export const deleteJob: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const result = await recruiterService.deleteJob(
      user.userId,
      (req.params.jobId as string),
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const applyToJob: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const application = await recruiterService.apply(
      user.userId,
      (req.params.jobId as string),
    );
    res.status(201).json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
};

export const listMyApplications: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const applications = await recruiterService.listMyApplications(
      user.userId,
    );
    res.json({ success: true, data: { applications } });
  } catch (error) {
    next(error);
  }
};

export const listJobApplications: RequestHandler = async (req, res, next) => {
  try {
    const user = requireUser(req as AuthRequest);
    const applications = await recruiterService.listJobApplications(
      user.userId,
      (req.params.jobId as string),
    );
    res.json({ success: true, data: { applications } });
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const user = requireUser(req as AuthRequest);
    const application = await recruiterService.updateApplicationStatus(
      user.userId,
      (req.params.applicationId as string),
      req.body,
    );
    res.json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
};
