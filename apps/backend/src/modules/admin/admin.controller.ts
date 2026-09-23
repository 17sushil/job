import type { RequestHandler } from 'express';

import type { User } from '../user/user.entity.js';
import { UserService } from '../user/user.service.js';

const userService = new UserService();

/** Password hashes never leave the API. */
function sanitize(user: User) {
  const { password, ...safe } = user;
  return safe;
}

export const listUsers: RequestHandler = async (_req, res, next) => {
  try {
    const users = await userService.listUsers();
    res.json({ success: true, data: { users: users.map(sanitize) } });
  } catch (error) {
    next(error);
  }
};

export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id as string);
    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
