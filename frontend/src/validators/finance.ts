/**
 * Zod validators for Maintenance, Fuel Log, and Expense forms.
 */
import { z } from "zod";

// ── Maintenance ────────────────────────────────────────
export const createMaintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  serviceType: z.string().min(1, "Service type is required"),
  description: z.string().max(1000).optional(),
  cost: z.coerce.number().nonnegative("Cost must be ≥ 0"),
  odometerAtService: z.coerce.number().nonnegative("Odometer must be ≥ 0"),
  technicianName: z.string().max(100).optional(),
  shopName: z.string().max(100).optional(),
  serviceDate: z.string().min(1, "Service date is required"),
  nextServiceDue: z.string().optional(),
});
export type CreateMaintenanceFormData = z.infer<typeof createMaintenanceSchema>;

// ── Fuel Log ───────────────────────────────────────────
export const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().optional(),
  liters: z.coerce.number().positive("Liters must be > 0"),
  costPerLiter: z.coerce.number().positive("Cost per liter must be > 0"),
  odometerAtFill: z.coerce.number().nonnegative("Odometer must be ≥ 0"),
  fuelStation: z.string().max(100).optional(),
});
export type CreateFuelLogFormData = z.infer<typeof createFuelLogSchema>;

// ── Expense ────────────────────────────────────────────
export const createExpenseSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  tripId: z.string().optional(),
  amount: z.coerce.number().nonnegative("Amount must be ≥ 0"),
  category: z.enum(["TOLL", "LODGING", "MAINTENANCE_EN_ROUTE", "MISC"]),
  description: z.string().max(500).optional(),
});
export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
