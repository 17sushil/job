import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  REMOTE = 'REMOTE',
}

@Entity({ name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  jobId!: string;

  @Index()
  @Column({ type: 'uuid' })
  recruiterId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  company!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar' })
  location!: string;

  @Column({ type: 'enum', enum: JobType, default: JobType.FULL_TIME })
  type!: JobType;

  @Column({ type: 'varchar', nullable: true })
  salaryRange!: string | null;

  @Index()
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.OPEN })
  status!: JobStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  pausedAt!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
