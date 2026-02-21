import { z } from 'zod';

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Public registration — always creates a DISPATCHER (lowest-privilege default).
// For role-specific user creation, Manager uses the CreateUserSchema endpoint.
export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

// Manager-only: create a user with an explicit role assignment
export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    role: z.enum(['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_ANALYST']),
});

// Manager-only: reset another user's password directly
export const ResetPasswordSchema = z.object({
    newPassword: passwordSchema,
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
