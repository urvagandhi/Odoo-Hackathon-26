/**
 * Vehicle form Zod validators.
 */
import { z } from "zod";

export const createVehicleSchema = z.object({
  licensePlate: z.string().min(2, "Plate must be at least 2 characters").max(20, "Plate too long"),
  make: z.string().min(1, "Make is required").max(50),
  model: z.string().min(1, "Model is required").max(50),
  year: z.coerce
    .number()
    .int()
    .min(1900, "Year too old")
    .max(new Date().getFullYear() + 1, "Year can't be in the future"),
  color: z.string().max(30).optional().or(z.literal("")),
  vin: z.string().max(17, "VIN must be 17 characters max").optional().or(z.literal("")),
  vehicleTypeId: z.string().min(1, "Vehicle type is required"),
  capacityWeight: z.coerce.number().positive("Capacity must be > 0"),
  capacityVolume: z.coerce.number().nonnegative().optional().or(z.literal("")),
  currentOdometer: z.coerce.number().nonnegative("Odometer must be ≥ 0").optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().omit({ currentOdometer: true });

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;
