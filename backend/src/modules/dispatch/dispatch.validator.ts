import { z } from 'zod';

export const CreateTripSchema = z.object({
    vehicleId: z.number().int().positive(),
    driverId: z.number().int().positive(),
    origin: z.string().min(2).max(200),
    destination: z.string().min(2).max(200),
    distanceEstimated: z.number().positive('Estimated distance must be > 0'),
    cargoWeight: z.number().positive().optional(),
    cargoDescription: z.string().max(500).optional(),
    clientName: z.string().max(100).optional(),
    invoiceReference: z.string().max(50).optional(),
    revenue: z.number().nonnegative().optional(),
});

export const UpdateTripSchema = z.object({
    origin: z.string().min(2).max(200).optional(),
    destination: z.string().min(2).max(200).optional(),
    distanceEstimated: z.number().positive().optional(),
    cargoWeight: z.number().positive().optional(),
    cargoDescription: z.string().max(500).optional(),
    clientName: z.string().max(100).optional(),
    invoiceReference: z.string().max(50).optional(),
    revenue: z.number().nonnegative().optional(),
});

export const TripStatusUpdateSchema = z.discriminatedUnion('status', [
    z.object({
        status: z.literal('DISPATCHED'),
        odometerStart: z.number().nonnegative().optional(),
    }),
    z.object({
        status: z.literal('COMPLETED'),
        distanceActual: z.number().positive('Actual distance must be > 0'),
        odometerEnd: z.number().nonnegative().optional(),
    }),
    z.object({
        status: z.literal('CANCELLED'),
        cancelledReason: z.string().min(5, 'Cancellation reason required (min 5 chars)'),
    }),
]);

export const TripQuerySchema = z.object({
    status: z.enum(['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED']).optional(),
    vehicleId: z.coerce.number().int().optional(),
    driverId: z.coerce.number().int().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTripInput = z.infer<typeof CreateTripSchema>;
export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
export type TripStatusUpdateInput = z.infer<typeof TripStatusUpdateSchema>;
export type TripQueryInput = z.infer<typeof TripQuerySchema>;
