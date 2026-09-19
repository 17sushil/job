import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../common/errors/AppError.js';
import { env } from '../../config/env.js';
import { redisClient } from '../../config/redis.js';
import { UserRepository } from '../user/user.repository.js';
import { z } from 'zod';
import { loginSchema, verifyOtpSchema, forgotPasswordSchema } from './auth.schema.js';

export class AuthService {
  private userRepo = new UserRepository();

  async login(data: z.infer<typeof loginSchema>) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError(401, 'Invalid email or password');
    }

    const token = jwt.sign(
      { userId: user.userId, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return { token, user };
  }

  async forgotPassword(data: z.infer<typeof forgotPasswordSchema>) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      // Return success anyway to prevent email enumeration
      return { message: 'If this email is registered, an OTP has been sent.' };
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash the OTP (Requirement: "otp hash , middleware")
    const hashedOtp = await bcrypt.hash(otp, 10);
    
    // Save to Redis (expires in 10 minutes)
    await redisClient.set(`otp:${user.email}`, hashedOtp, { EX: 600 });
    
    // In a real app, send via email/SMS here
    console.log(`[DEBUG] OTP for ${user.email} is ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtpAndResetPassword(data: z.infer<typeof verifyOtpSchema>) {
    const hashedOtp = await redisClient.get(`otp:${data.email}`);
    if (!hashedOtp) {
      throw new AppError(400, 'OTP expired or not requested');
    }

    const isMatch = await bcrypt.compare(data.otp, hashedOtp);
    if (!isMatch) {
      throw new AppError(400, 'Invalid OTP');
    }

    const user = await this.userRepo.findByEmail(data.email);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const hashedNewPassword = await bcrypt.hash(data.newPassword, 10);
    await this.userRepo.update(user.userId, { password: hashedNewPassword });

    // Delete OTP after successful use
    await redisClient.del(`otp:${data.email}`);

    return { message: 'Password reset successfully' };
  }
}
