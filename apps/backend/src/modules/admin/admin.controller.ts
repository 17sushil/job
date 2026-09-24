import type { RequestHandler } from 'express';

import { AppError } from '../../common/errors/AppError.js';
import { AppDataSource } from '../../database/data-source.js';
import type { AuthRequest } from '../../middlewares/auth.middleware.js';
import { Application } from '../recruiter/application.entity.js';
import { Job } from '../recruiter/job.entity.js';
import { UserRepository } from '../user/user.repository.js';
import { UserRole, type User } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';

const userService = new UserService();
const userRepo = new UserRepository();
const jobRepo = () => AppDataSource.getRepository(Job);
const applicationRepo = () => AppDataSource.getRepository(Application);

const ADMIN_FAMILY = [UserRole.ADMIN, UserRole.SUPERADMIN];

/** Password hashes never leave the API. */
function sanitize(user: User) {
  const { password, ...safe } = user;
  return safe;
}

function requireUser(req: AuthRequest) {
  if (!req.user) throw new AppError(401, 'Authentication required');
  return req.user;
}

/**
 * Hierarchy: ADMIN manages CANDIDATE and RECRUITER accounts; only
 * SUPERADMIN may touch ADMIN or SUPERADMIN accounts, and only SUPERADMIN
 * may create or assign admin-family roles.
 */
function assertCanManage(actor: UserRole, target: UserRole) {
  if (ADMIN_FAMILY.includes(target) && actor !== UserRole.SUPERADMIN) {
    throw new AppError(
      403,
      'Only a super admin can manage admin accounts',
    );
  }
}

export const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: { users: users.map(sanitize) } });
  } catch (error) {
    next(error);
  }
};

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const actor = requireUser(req as AuthRequest);
    assertCanManage(actor.role, req.body.role);
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: { user: sanitize(user) } });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const actor = requireUser(req as AuthRequest);
    const target = await userService.getUserById(req.params.id as string);
    if (target.userId === actor.userId) {
      throw new AppError(409, 'You cannot modify your own account here');
    }
    assertCanManage(actor.role, target.role);
    if (
      req.body.role &&
      req.body.role !== target.role &&
      (ADMIN_FAMILY.includes(req.body.role) ||
        ADMIN_FAMILY.includes(target.role)) &&
      actor.role !== UserRole.SUPERADMIN
    ) {
      throw new AppError(
        403,
        'Only a super admin can change admin-family roles',
      );
    }
    const updated = await userService.updateUser(target.userId, req.body);
    res.json({ success: true, data: { user: sanitize(updated) } });
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const actor = requireUser(req as AuthRequest);
    const target = await userService.getUserById(req.params.id as string);
    if (target.userId === actor.userId) {
      throw new AppError(409, 'You cannot delete your own account here');
    }
    assertCanManage(actor.role, target.role);
    await userService.deleteUser(target.userId);
    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};

export const stats: RequestHandler = async (_req, res, next) => {
  try {
    const users = await userRepo.findMany();
    const jobs = await jobRepo().find();
    const applications = await applicationRepo().find();

    const count = (role: UserRole) =>
      users.filter((user) => user.role === role).length;

    res.json({
      success: true,
      data: {
        stats: {
          users: users.length,
          candidates: count(UserRole.CANDIDATE),
          recruiters: count(UserRole.RECRUITER),
          admins: count(UserRole.ADMIN) + count(UserRole.SUPERADMIN),
          blocked: users.filter((user) => user.blocked).length,
          jobs: jobs.length,
          openJobs: jobs.filter((job) => job.status === 'OPEN').length,
          applications: applications.length,
          hired: applications.filter(
            (application) => application.status === 'HIRED',
          ).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listJobs: RequestHandler = async (_req, res, next) => {
  try {
    const jobs = await jobRepo().find({ order: { createdAt: 'desc' } });
    res.json({ success: true, data: { jobs } });
  } catch (error) {
    next(error);
  }
};

export const deleteJob: RequestHandler = async (req, res, next) => {
  try {
    const jobId = req.params.id as string;
    const job = await jobRepo().findOneBy({ jobId });
    if (!job) throw new AppError(404, 'Job not found');
    await applicationRepo().delete({ jobId });
    await jobRepo().delete({ jobId });
    res.json({ success: true, data: { message: 'Job deleted' } });
  } catch (error) {
    next(error);
  }
};

export const listApplications: RequestHandler = async (_req, res, next) => {
  try {
    const applications = await applicationRepo().find({
      order: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { applications } });
  } catch (error) {
    next(error);
  }
};
