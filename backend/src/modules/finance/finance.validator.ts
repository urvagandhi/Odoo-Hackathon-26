import { z } from 'zod';

export const CreateFuelLogSchema = z.object({
    vehicleId: z.coerce.number().int().positive(),
    tripId: z.coerce.number().int().positive().optional(),
    liters: z.coerce.number().positive('Liters must be > 0'),
    costPerLiter: z.coerce.number().positive('Cost per liter must be > 0'),
    odometerAtFill: z.coerce.number().nonnegative('Odometer must be >= 0'),
    fuelStation: z.string().max(100).optional(),
});

export const CreateExpenseSchema = z.object({
    vehicleId: z.coerce.number().int().positive(),
    tripId: z.coerce.number().int().positive().optional(),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    category: z.enum(['TOLL', 'LODGING', 'MAINTENANCE_EN_ROUTE', 'MISC']),
    description: z.string().max(500).optional(),
});

// Accept both "YYYY-MM-DD" and full ISO datetime strings
const flexDate = z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Invalid date format' },
);

export const CreateMaintenanceLogSchema = z.object({
    vehicleId: z.coerce.number().int().positive(),
    serviceType: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    cost: z.coerce.number().nonnegative(),
    odometerAtService: z.coerce.number().nonnegative(),
    technicianName: z.string().max(100).optional(),
    shopName: z.string().max(100).optional(),
    serviceDate: flexDate,
    nextServiceDue: flexDate.optional(),
});

export type CreateFuelLogInput = z.infer<typeof CreateFuelLogSchema>;
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
export type CreateMaintenanceLogInput = z.infer<typeof CreateMaintenanceLogSchema>;
