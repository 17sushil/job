import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'profile_views' })
export class ProfileView {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  recruiterId!: string;

  @Column({ type: 'uuid' })
  candidateId!: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt!: Date;

  // @Column({ type: 'timestamp with time zone', nullable: true })
  // expiresAt!: Date; // TODO: Uncomment when we have more users to enforce 2-month expiry
}
