import { z } from 'zod';

export const CreateIncidentSchema = z.object({
    vehicleId: z.coerce.number().int().positive().optional(),
    driverId: z.coerce.number().int().positive().optional(),
    tripId: z.coerce.number().int().positive().optional(),
    incidentType: z.enum(['ACCIDENT', 'BREAKDOWN', 'TRAFFIC_VIOLATION', 'THEFT', 'CARGO_DAMAGE', 'NEAR_MISS', 'OTHER']),
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    incidentDate: z.string().datetime({ message: 'incidentDate must be a valid ISO 8601 datetime' }),
    location: z.string().max(200).optional(),
    injuriesReported: z.boolean().default(false),
    damageEstimate: z.number().nonnegative().optional(),
});

export const UpdateIncidentSchema = z.object({
    incidentType: z.enum(['ACCIDENT', 'BREAKDOWN', 'TRAFFIC_VIOLATION', 'THEFT', 'CARGO_DAMAGE', 'NEAR_MISS', 'OTHER']).optional(),
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    incidentDate: z.string().datetime().optional(),
    location: z.string().max(200).optional(),
    injuriesReported: z.boolean().optional(),
    damageEstimate: z.number().nonnegative().optional(),
    status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
    resolution: z.string().optional(),
});

export const CloseIncidentSchema = z.object({
    resolution: z.string().min(10, 'Resolution must be at least 10 characters'),
});

export const IncidentQuerySchema = z.object({
    status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
    incidentType: z.enum(['ACCIDENT', 'BREAKDOWN', 'TRAFFIC_VIOLATION', 'THEFT', 'CARGO_DAMAGE', 'NEAR_MISS', 'OTHER']).optional(),
    vehicleId: z.coerce.number().int().positive().optional(),
    driverId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentSchema>;
export type CloseIncidentInput = z.infer<typeof CloseIncidentSchema>;
export type IncidentQueryInput = z.infer<typeof IncidentQuerySchema>;
