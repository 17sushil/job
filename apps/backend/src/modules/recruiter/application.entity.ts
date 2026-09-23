import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  NEW = 'NEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'applications' })
@Unique('UQ_applications_job_candidate', ['jobId', 'candidateId'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  applicationId!: string;

  @Index()
  @Column({ type: 'uuid' })
  jobId!: string;

  @Index()
  @Column({ type: 'uuid' })
  candidateId!: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.NEW,
  })
  status!: ApplicationStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  interviewAt!: Date | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
