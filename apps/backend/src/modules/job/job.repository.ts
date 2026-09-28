import { AppDataSource } from '../../database/data-source.js';
import { Job } from './job.entity.js';

export class JobRepository {
  private readonly repository = AppDataSource.getRepository(Job);

  async findOpen() {
    return this.repository.find({
      where: { isDeleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async countActive() {
    return this.repository.count({ where: { isDeleted: false } });
  }

  async findById(id: string) {
    return this.repository.findOneBy({ id });
  }

  async create(data: Partial<Job>) {
    return this.repository.save(this.repository.create(data));
  }

  async softDelete(id: string) {
    await this.repository.update(id, { isDeleted: true });
  }
}
