import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nullable: phone-only signups have no email. */
  @Column({ type: 'varchar', unique: true, nullable: true })
  email!: string | null;

  /** Nullable: email-only signups have no phone. */
  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', default: 'candidate' })
  role!: string;

  /** bcrypt hash - never expose this field to clients. */
  @Column({ type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
