/**
 * Trip form Zod validators.
 */
import { z } from "zod";

export const createTripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  origin: z.string().min(2, "Origin must be at least 2 characters").max(200),
  destination: z.string().min(2, "Destination must be at least 2 characters").max(200),
  cargoWeight: z.coerce.number().nonnegative("Cargo weight must be ≥ 0"),
  distanceEstimated: z.coerce.number().positive("Estimated distance must be > 0"),
  cargoDescription: z.string().max(500).optional().or(z.literal("")),
  clientName: z.string().max(200).optional().or(z.literal("")),
  revenue: z.coerce.number().nonnegative("Revenue must be ≥ 0").optional().or(z.literal("")),
});

export const completeTripSchema = z.object({
  distanceActual: z.coerce.number().positive("Actual distance must be > 0"),
  odometerEnd: z.coerce.number().nonnegative().optional().or(z.literal("")),
});

export const cancelTripSchema = z.object({
  cancelledReason: z.string().min(5, "Reason must be at least 5 characters"),
});

export type CreateTripFormData = z.infer<typeof createTripSchema>;
export type CompleteTripFormData = z.infer<typeof completeTripSchema>;
export type CancelTripFormData = z.infer<typeof cancelTripSchema>;
