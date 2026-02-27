import { z } from 'zod';

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
});

// Admin-only: create a new user with an explicit role assignment.
// Public registration is disabled — only MANAGER can create accounts.
export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    role: z.enum(['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_ANALYST']),
});

// Authenticated user changes their own password.
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});

// Forgot password — user submits their email to receive a reset token.
export const ForgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

// Reset password — user provides token + new password.
export const ResetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
});

// Manager-only: directly reset a user's password (no token required)
export const AdminResetPasswordSchema = z.object({
    newPassword: passwordSchema,
});

// Authenticated user updates their own profile (name, email).
export const UpdateProfileSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    email: z.string().email('Invalid email address').optional(),
});

// RegisterSchema alias (used internally by auth.service register())
export const RegisterSchema = CreateUserSchema;

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof AdminResetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
