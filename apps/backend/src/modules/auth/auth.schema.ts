import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().optional(),
  identifier: z.string().optional(), // Sushil's frontend sends this
  password: z.string().min(6),
}).refine(data => data.email || data.identifier, {
  message: "Email or identifier is required"
}).transform(data => ({
  ...data,
  email: (data.email || data.identifier) as string, // Map identifier to email internally
}));

export const registerSchema = z.any();
export const changePasswordSchema = z.any();
export const updateProfileSchema = z.any();

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
});
