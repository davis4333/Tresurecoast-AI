import { z } from "zod";

export const BusinessSettingsUpdateSchema = z.object({
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(200, "Business name must be 200 characters or less")
    .optional(),
  category: z
    .string()
    .max(100, "Category must be 100 characters or less")
    .optional(),
  phone: z
    .string()
    .max(50, "Phone must be 50 characters or less")
    .nullable()
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less")
    .nullable()
    .optional(),
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .nullable()
    .optional(),
  serviceArea: z
    .string()
    .max(500, "Service area must be 500 characters or less")
    .nullable()
    .optional(),
  websiteUrl: z
    .string()
    .url("Invalid website URL")
    .max(500, "Website URL must be 500 characters or less")
    .nullable()
    .optional(),
  bookingUrl: z
    .string()
    .url("Invalid booking URL")
    .max(500, "Booking URL must be 500 characters or less")
    .nullable()
    .optional(),
  tone: z
    .enum(["professional", "friendly", "luxury", "bold", "chill"])
    .optional(),
  primaryGoal: z
    .enum(["bookings", "leads", "faqs", "support"])
    .optional(),
  cancellationPolicy: z
    .string()
    .max(2000, "Cancellation policy must be 2000 characters or less")
    .nullable()
    .optional(),
  depositPolicy: z
    .string()
    .max(2000, "Deposit policy must be 2000 characters or less")
    .nullable()
    .optional(),
  refundPolicy: z
    .string()
    .max(2000, "Refund policy must be 2000 characters or less")
    .nullable()
    .optional(),
});

export type BusinessSettingsUpdate = z.infer<typeof BusinessSettingsUpdateSchema>;

export function sanitizeBusinessSettings(data: BusinessSettingsUpdate): BusinessSettingsUpdate {
  const sanitized: BusinessSettingsUpdate = {};

  if (data.businessName !== undefined) {
    sanitized.businessName = data.businessName.trim();
  }
  if (data.category !== undefined) {
    sanitized.category = data.category.trim();
  }
  if (data.phone !== undefined) {
    sanitized.phone = data.phone?.trim() || null;
  }
  if (data.email !== undefined) {
    sanitized.email = data.email?.trim().toLowerCase() || null;
  }
  if (data.address !== undefined) {
    sanitized.address = data.address?.trim() || null;
  }
  if (data.serviceArea !== undefined) {
    sanitized.serviceArea = data.serviceArea?.trim() || null;
  }
  if (data.websiteUrl !== undefined) {
    sanitized.websiteUrl = data.websiteUrl?.trim() || null;
  }
  if (data.bookingUrl !== undefined) {
    sanitized.bookingUrl = data.bookingUrl?.trim() || null;
  }
  if (data.tone !== undefined) {
    sanitized.tone = data.tone;
  }
  if (data.primaryGoal !== undefined) {
    sanitized.primaryGoal = data.primaryGoal;
  }
  if (data.cancellationPolicy !== undefined) {
    sanitized.cancellationPolicy = data.cancellationPolicy?.trim() || null;
  }
  if (data.depositPolicy !== undefined) {
    sanitized.depositPolicy = data.depositPolicy?.trim() || null;
  }
  if (data.refundPolicy !== undefined) {
    sanitized.refundPolicy = data.refundPolicy?.trim() || null;
  }

  return sanitized;
}
