import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { AppError } from '../../common/errors/AppError.js';
import { env } from '../../config/env.js';
import { kvDel, kvGet, kvSet } from '../../config/redis.js';
import type { User } from '../user/user.entity.js';
import { UserRepository } from '../user/user.repository.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  pickIdentifier,
  verifyOtpSchema,
} from './auth.schema.js';

export class AuthService {
  private userRepo = new UserRepository();

  /** Resolve a user from an email-or-mobile identifier. */
  async findByIdentifier(identifier: string): Promise<User | null> {
    const byEmail = await this.userRepo.findByEmail(identifier);
    if (byEmail) return byEmail;
    return this.userRepo.findByMobile(identifier);
  }

  async login(data: z.infer<typeof loginSchema>) {
    const user = await this.findByIdentifier(data.identifier);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (user.blocked) {
      throw new AppError(403, 'This account has been blocked by an admin');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    return { token, user };
  }

  async me(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(401, 'Session is no longer valid');
    }
    if (user.blocked) {
      throw new AppError(403, 'This account has been blocked by an admin');
    }
    return user;
  }

  async forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
    const user = await this.findByIdentifier(pickIdentifier(data));
    if (!user) {
      // Return success anyway to prevent account enumeration
      return { message: 'If this account exists, a one-time code has been issued.' };
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP before storing it
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save for 10 minutes (Redis when available, memory otherwise)
    await kvSet(`otp:${user.userId}`, hashedOtp, 600);

    // In a real app, send via email/SMS here
    console.log(`[DEBUG] OTP for ${user.email ?? user.mobile} is ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtpAndResetPassword(data: z.infer<typeof verifyOtpSchema>) {
    const user = await this.findByIdentifier(pickIdentifier(data));
    const hashedOtp = user ? await kvGet(`otp:${user.userId}`) : null;
    if (!user || !hashedOtp) {
      throw new AppError(400, 'OTP expired or not requested');
    }

    const isMatch = await bcrypt.compare(data.otp, hashedOtp);
    if (!isMatch) {
      throw new AppError(400, 'Invalid OTP');
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
    await this.userRepo.update(user.userId, { password: hashedNewPassword });

    // Delete OTP after successful use
    await kvDel(`otp:${user.userId}`);

    return { message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    data: z.infer<typeof changePasswordSchema>,
  ) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new AppError(400, 'Current password is incorrect');
    }

    const hashed = await bcrypt.hash(data.newPassword, 10);
    await this.userRepo.update(userId, { password: hashed });
    return { message: 'Password changed successfully' };
  }

  async updateName(userId: string, name: string) {
    return this.userRepo.update(userId, { name });
  }
}
