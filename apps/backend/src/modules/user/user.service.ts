import { AppError } from '../../common/errors/AppError.js';
import { UserRepository } from './user.repository.js';
import type { CreateUserInput, UpdateUserInput } from './user.types.js';

export class UserService {
  constructor(private repo = new UserRepository()) {}

  async listUsers() {
    return this.repo.findMany();
  }

  async getUserById(id: string) {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError(404, `User with ID ${id} not found`);
    }
    return user;
  }

  async createUser(data: CreateUserInput) {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new AppError(409, 'User with this email already exists');
    }
    return this.repo.create(data);
  }

  async updateUser(id: string, data: UpdateUserInput) {
    await this.getUserById(id);
    return this.repo.update(id, data);
  }

  async deleteUser(id: string) {
    await this.getUserById(id);
    return this.repo.delete(id);
  }
}

