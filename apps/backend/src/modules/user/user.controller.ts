import type { RequestHandler } from 'express';
import { UserService } from './user.service.js';
import { RequiredError } from '../../common/errors/RequiredError.js';
import type { User } from './user.entity.js';

const userService = new UserService();

/** Password hashes never leave the API, not even on admin endpoints. */
function sanitize(user: User) {
  const { password, ...safe } = user;
  return safe;
}

export const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: users.map(sanitize) });
  } catch (error) {
    next(error);
  }
};

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (!id) throw new RequiredError('UserId is required');
    const user = await userService.getUserById(id);
    res.json({ success: true, data: sanitize(user) });
  } catch (error) {
    next(error);
  }
};

export const createUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: sanitize(user) });
  } catch (error) {
    next(error);
  }
};

export const updateUser: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (!id) throw new RequiredError('UserId is required');
    const user = await userService.updateUser(id, req.body);
    res.json({ success: true, data: sanitize(user) });
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params.id as string;
    if (!id) throw new RequiredError('UserId is required');
    await userService.deleteUser(id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

