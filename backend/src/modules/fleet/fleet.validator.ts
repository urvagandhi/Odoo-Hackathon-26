import { z } from 'zod';

export const CreateVehicleSchema = z.object({
    licensePlate: z.string().min(2).max(20),
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    color: z.string().max(30).optional(),
    vin: z.string().max(17).optional(),
    vehicleTypeId: z.number().int().positive(),
    currentOdometer: z.number().nonnegative().default(0),
    capacityWeight: z.number().positive().optional(),
    capacityVolume: z.number().positive().optional(),
});

export const UpdateVehicleSchema = CreateVehicleSchema.partial().omit({ licensePlate: true });

export const VehicleStatusUpdateSchema = z.object({
    status: z.enum(['AVAILABLE', 'IN_SHOP', 'RETIRED']),
    reason: z.string().optional(),
});

export const VehicleQuerySchema = z.object({
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
    vehicleTypeId: z.coerce.number().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof UpdateVehicleSchema>;
export type VehicleStatusUpdateInput = z.infer<typeof VehicleStatusUpdateSchema>;
export type VehicleQueryInput = z.infer<typeof VehicleQuerySchema>;

// ── Vehicle Document Schemas ─────────────────────────────────────

export const CreateVehicleDocumentSchema = z.object({
    documentType: z.enum(['INSURANCE', 'REGISTRATION', 'INSPECTION', 'PERMIT', 'WARRANTY', 'OTHER']),
    documentNumber: z.string().max(100).optional(),
    issuedBy: z.string().max(200).optional(),
    issuedAt: z.string().date().optional(),    // YYYY-MM-DD
    expiresAt: z.string().date('expiresAt must be a valid date (YYYY-MM-DD)'),
    notes: z.string().optional(),
});

export const UpdateVehicleDocumentSchema = CreateVehicleDocumentSchema.partial();

export type CreateVehicleDocumentInput = z.infer<typeof CreateVehicleDocumentSchema>;
export type UpdateVehicleDocumentInput = z.infer<typeof UpdateVehicleDocumentSchema>;
