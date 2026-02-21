/**
 * Driver form Zod validators.
 */
import { z } from "zod";

export const createDriverSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  licenseNumber: z.string().min(3, "License must be at least 3 characters").max(30, "License too long"),
  licenseExpiryDate: z.string().min(1, "License expiry date is required").refine(
    (val) => new Date(val) > new Date(),
    "License expiry must be in the future"
  ),
  licenseClass: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.union([z.string().email("Invalid email"), z.literal("")]).optional(),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverFormData = z.infer<typeof createDriverSchema>;
export type UpdateDriverFormData = z.infer<typeof updateDriverSchema>;
