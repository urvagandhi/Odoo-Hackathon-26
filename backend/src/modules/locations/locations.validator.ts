import { z } from 'zod';

export const CreateLocationSchema = z.object({
    vehicleId: z.number().int().positive(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().nonnegative().optional(),
    heading: z.number().min(0).max(360).optional(),
    accuracy: z.number().nonnegative().optional(),
});

export type CreateLocationInput = z.infer<typeof CreateLocationSchema>;
