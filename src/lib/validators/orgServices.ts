import { z } from "zod";

export function normalizeServiceName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function serviceNameKey(name: string): string {
  return normalizeServiceName(name).toLowerCase();
}

const urlOrEmpty = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val === "" || /^https?:\/\/.+/.test(val), {
    message: "Must be a valid URL starting with http:// or https://",
  })
  .transform((val) => (val === "" ? null : val));

export const OrganizationServiceCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or less")
    .transform(normalizeServiceName)
    .refine((val) => val.length >= 2, {
      message: "Name must be at least 2 characters",
    }),
  priceCents: z
    .number()
    .int()
    .min(0, "Price cannot be negative")
    .optional()
    .nullable()
    .transform((val) => val ?? null),
  bookingUrl: urlOrEmpty.optional().nullable().default(null),
  paymentUrl: urlOrEmpty.optional().nullable().default(null),
  displayOrder: z
    .number()
    .int()
    .min(0, "Display order cannot be negative")
    .optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
});

export type OrganizationServiceCreateInput = z.infer<
  typeof OrganizationServiceCreateSchema
>;

export const OrganizationServiceUpdateSchema = z.object({
  id: z.number().int().positive("Invalid service ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(80, "Name must be 80 characters or less")
    .transform(normalizeServiceName)
    .refine((val) => val.length >= 2, {
      message: "Name must be at least 2 characters",
    })
    .optional(),
  priceCents: z
    .number()
    .int()
    .min(0, "Price cannot be negative")
    .optional()
    .nullable(),
  bookingUrl: urlOrEmpty.optional().nullable(),
  paymentUrl: urlOrEmpty.optional().nullable(),
  displayOrder: z
    .number()
    .int()
    .min(0, "Display order cannot be negative")
    .optional(),
  isActive: z.boolean().optional(),
});

export type OrganizationServiceUpdateInput = z.infer<
  typeof OrganizationServiceUpdateSchema
>;

export const OrganizationServiceDeleteSchema = z.object({
  id: z.number().int().positive("Invalid service ID"),
});
