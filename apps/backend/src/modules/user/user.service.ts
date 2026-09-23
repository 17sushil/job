import * as bcrypt from 'bcrypt';

import { AppError } from '../../common/errors/AppError.js';
import type { User } from './user.entity.js';
import { UserRepository } from './user.repository.js';
import type { CreateUserInput, UpdateUserInput } from './user.types.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService {
  constructor(private repo = new UserRepository()) {}

  async listUsers() {
    return this.repo.findMany();
  }

  async getUserById(userId: string) {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new AppError(404, `User with ID ${userId} not found`);
    }
    return user;
  }

  async createUser(data: CreateUserInput) {
    // Place the identifier into the right column: email or mobile.
    const raw = (data.identifier ?? '').trim();
    const looksEmail = EMAIL_RE.test(raw);
    const email = (data.email ?? (looksEmail ? raw : '')).trim() || null;
    const mobile = (data.mobile ?? (!looksEmail ? raw : '')).trim() || null;

    if (!email && !mobile) {
      throw new AppError(400, 'Email or phone is required');
    }

    if (email) {
      const existingEmail = await this.repo.findByEmail(email);
      if (existingEmail) {
        throw new AppError(409, 'User with this email already exists');
      }
    }

    if (mobile) {
      const existingMobile = await this.repo.findByMobile(mobile);
      if (existingMobile) {
        throw new AppError(409, 'User with this mobile already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.repo.create({
      email,
      mobile,
      name: data.name ?? null,
      password: hashedPassword,
      role: data.role,
    } as Partial<User>);
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    await this.getUserById(userId);

    const patch: Partial<User> = { ...data };
    if (data.password) {
      patch.password = await bcrypt.hash(data.password, 10);
    }
    return this.repo.update(userId, patch);
  }

  async deleteUser(userId: string) {
    await this.getUserById(userId);
    return this.repo.delete(userId);
  }
}
