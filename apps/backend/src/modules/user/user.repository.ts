import { AppDataSource } from '../../database/data-source.js';
import { User } from './user.entity.js';

export class UserRepository {
  private readonly repository = AppDataSource.getRepository(User);

  async findMany() {
    return this.repository.find({
      order: { createdAt: 'desc' },
    });
  }

  async findById(userId: string) {
    return this.repository.findOneBy({ userId });
  }

  async findByEmail(email: string) {
    return this.repository.findOneBy({ email });
  }

  async findByMobile(mobile: string) {
    return this.repository.findOneBy({ mobile });
  }

  async create(data: Partial<User>) {
    return this.repository.save(this.repository.create(data));
  }

  async update(userId: string, data: Partial<User>) {
    await this.repository.update(userId, data);
    return this.repository.findOneByOrFail({ userId });
  }

  async delete(userId: string) {
    await this.repository.delete(userId);
  }
}
