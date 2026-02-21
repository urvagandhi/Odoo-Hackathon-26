import { z } from 'zod';

export const DriverStatusSelfUpdateSchema = z.object({
    status: z.enum(['ON_DUTY', 'OFF_DUTY'], {
        errorMap: () => ({ message: 'Status must be ON_DUTY or OFF_DUTY' }),
    }),
});

export const SelfLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    speed: z.number().nonnegative().optional(),
    heading: z.number().min(0).max(360).optional(),
    accuracy: z.number().nonnegative().optional(),
});

export type DriverStatusSelfUpdateInput = z.infer<typeof DriverStatusSelfUpdateSchema>;
export type SelfLocationInput = z.infer<typeof SelfLocationSchema>;
