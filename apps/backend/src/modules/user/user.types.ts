import type { UserRole } from './user.entity.js';

export interface CreateUserInput {
  email: string | null;
  mobile: string;
  password: string;
  role: UserRole;
}

export type UpdateUserInput = Partial<{
  email: string | null;
  mobile: string;
  password: string;
  role: UserRole;
  name: string | null;
  otpHash: string | null;
  otpExpiry: Date | null;
  companyName: string | null;
  contactNumber: string | null;
  avatar: string | null;
  isDeleted: boolean;
}>;
