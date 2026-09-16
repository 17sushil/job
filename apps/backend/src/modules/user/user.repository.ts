import { AppDataSource } from '../../database/data-source.js';
import { User } from './user.entity.js';
import type { CreateUserInput, UpdateUserInput } from './user.types.js';

export class UserRepository {
  private get repository() {
    return AppDataSource.getRepository(User);
  }

  async findMany() {
    return this.repository.find({
      order: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string) {
    return this.repository.findOneBy({ email });
  }

  async create(data: CreateUserInput) {
    return this.repository.save(this.repository.create(data));
  }

  async update(id: string, data: UpdateUserInput) {
    await this.repository.update(id, data);
    return this.repository.findOneByOrFail({ id });
  }

  async delete(id: string) {
    await this.repository.delete(id);
  }
}
