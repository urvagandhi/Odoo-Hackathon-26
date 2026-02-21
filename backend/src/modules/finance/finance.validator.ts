import { z } from 'zod';

export const CreateFuelLogSchema = z.object({
    vehicleId: z.number().int().positive(),
    tripId: z.number().int().positive().optional(),
    liters: z.number().positive('Liters must be > 0'),
    costPerLiter: z.number().positive('Cost per liter must be > 0'),
    odometerAtFill: z.number().nonnegative('Odometer must be >= 0'),
    fuelStation: z.string().max(100).optional(),
});

export const CreateExpenseSchema = z.object({
    vehicleId: z.number().int().positive(),
    tripId: z.number().int().positive().optional(),
    amount: z.number().nonnegative('Amount must be >= 0'),
    category: z.enum(['TOLL', 'LODGING', 'MAINTENANCE_EN_ROUTE', 'MISC']),
    description: z.string().max(500).optional(),
});

export const CreateMaintenanceLogSchema = z.object({
    vehicleId: z.number().int().positive(),
    serviceType: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    cost: z.number().nonnegative(),
    odometerAtService: z.number().nonnegative(),
    technicianName: z.string().max(100).optional(),
    shopName: z.string().max(100).optional(),
    serviceDate: z.string().datetime(),
    nextServiceDue: z.string().datetime().optional(),
});

export type CreateFuelLogInput = z.infer<typeof CreateFuelLogSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type CreateMaintenanceLogInput = z.infer<typeof CreateMaintenanceLogSchema>;
