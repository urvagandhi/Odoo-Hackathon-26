import { z } from 'zod';

// Accept both "YYYY-MM-DD" and full ISO datetime strings
const dateStr = z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Invalid date format' },
);

export const CreateDriverSchema = z.object({
    licenseNumber: z.string().min(3).max(30),
    fullName: z.string().min(2).max(100),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    dateOfBirth: dateStr.optional(),
    licenseExpiryDate: dateStr,
    licenseClass: z.string().max(10).optional(),
    safetyScore: z.coerce.number().min(0).max(100).default(100),
});

export const UpdateDriverSchema = CreateDriverSchema.partial();

export const DriverStatusUpdateSchema = z.object({
    status: z.enum(['ON_DUTY', 'OFF_DUTY', 'SUSPENDED']),
    reason: z.string().optional(),
});

export const AdjustSafetyScoreSchema = z.object({
    score: z.number().min(0).max(100),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const DriverQuerySchema = z.object({
    status: z.enum(['ON_DUTY', 'OFF_DUTY', 'ON_TRIP', 'SUSPENDED']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateDriverInput = z.infer<typeof CreateDriverSchema>;
export type UpdateDriverInput = z.infer<typeof UpdateDriverSchema>;
export type DriverStatusUpdateInput = z.infer<typeof DriverStatusUpdateSchema>;
export type AdjustSafetyScoreInput = z.infer<typeof AdjustSafetyScoreSchema>;
export type DriverQueryInput = z.infer<typeof DriverQuerySchema>;
