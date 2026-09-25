import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  CANDIDATE = 'CANDIDATE',
  RECRUITER = 'RECRUITER',
  SUPERADMIN = 'SUPERADMIN',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CANDIDATE,
  })
  role!: UserRole;

  /** Email or mobile identifies the account; at least one is always set. */
  @Column({ type: 'varchar', unique: true, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', unique: true, nullable: true })
  mobile!: string | null;

  @Column({ type: 'varchar', nullable: true })
  name!: string | null;

  /** Blocked accounts cannot sign in or use the session endpoints. */
  @Column({ type: 'boolean', default: false })
  blocked!: boolean;

  /** Recruiter profile fields shown on job posts. */
  @Column({ type: 'varchar', nullable: true })
  companyName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  contactNumber!: string | null;

  /** Data URL of the uploaded profile image. */
  @Column({ type: 'text', nullable: true })
  avatar!: string | null;

  @Column({ type: 'varchar' })
  password!: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
