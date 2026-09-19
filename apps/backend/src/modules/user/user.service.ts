import { AppError } from '../../common/errors/AppError.js';
import { UserRepository } from './user.repository.js';
import type { CreateUserInput, UpdateUserInput } from './user.types.js';
import * as bcrypt from 'bcrypt';

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
    const existingEmail = await this.repo.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError(409, 'User with this email already exists');
    }
    
    const existingMobile = await this.repo.findByMobile(data.mobile);
    if (existingMobile) {
      throw new AppError(409, 'User with this mobile already exists');
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.repo.create({ ...data, password: hashedPassword });
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    await this.getUserById(userId);
    
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.repo.update(userId, data);
  }

  async deleteUser(userId: string) {
    await this.getUserById(userId);
    return this.repo.delete(userId);
  }
}
