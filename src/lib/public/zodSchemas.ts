import { z } from "zod";

// Helper: trim strings and treat empty strings as undefined
const trimmedOptional = (max: number) =>
  z
    .preprocess(
      (v: unknown) => (typeof v === "string" ? v.trim() : v),
      z.string().min(1).max(max)
    )
    .optional();

export const ChatRequestSchema = z.object({
  botPublicKey: z.string().uuid("Invalid bot key"),
  conversationPublicId: z.string().uuid("Invalid conversation id").nullable().optional(),
  message: z.string().trim().min(1).max(2000)
});

export const LeadRequestSchema = z
  .object({
    botPublicKey: z.string().uuid("Invalid bot key"),
    conversationPublicId: z.string().uuid("Invalid conversation id"),
    name: trimmedOptional(100),
    email: trimmedOptional(254),
    phone: trimmedOptional(20)
  })
  .refine(
    (data: { name?: string; email?: string; phone?: string }) => {
      const hasName = typeof data.name === "string" && data.name.length <= 100;
      const hasEmail = typeof data.email === "string" && data.email.includes("@");
      const hasPhone = typeof data.phone === "string" && data.phone.length <= 20;
      return hasName || hasEmail || hasPhone;
    },
    { message: "At least one contact field required" }
  );

export const LeadStatusPatchSchema = z.object({
  botPublicKey: z.string().uuid("Invalid bot key"),
  leadPublicId: z.string().uuid("Invalid lead id"),
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "CLOSED"], {
    error: "Invalid status. Must be NEW, CONTACTED, BOOKED, or CLOSED"
  })
});

// Bot update schemas
export const BotLinkSchema = z.object({
  type: z.enum(["BOOKING", "PAYMENT", "CONTACT", "OTHER"]),
  label: z.string().min(1).max(100),
  url: z.string().url().max(500)
});

export const BotServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  priceRange: z.string().max(50).optional().nullable(),
  durationMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  active: z.boolean().default(true)
});

export const BotHoursSchema = z.object({
  monday: z.string().max(100).optional().nullable(),
  tuesday: z.string().max(100).optional().nullable(),
  wednesday: z.string().max(100).optional().nullable(),
  thursday: z.string().max(100).optional().nullable(),
  friday: z.string().max(100).optional().nullable(),
  saturday: z.string().max(100).optional().nullable(),
  sunday: z.string().max(100).optional().nullable()
});

export const BotUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  greeting: z.string().max(500).optional().nullable(),
  fallbackText: z.string().max(1000).optional().nullable(),
  businessPhone: z.string().max(30).optional().nullable(),
  businessEmail: z.string().email().max(254).optional().nullable(),
  businessAddress: z.string().max(300).optional().nullable(),
  hours: BotHoursSchema.optional().nullable(),
  services: z.array(BotServiceSchema).max(50).optional().nullable(),
  links: z.array(BotLinkSchema).max(20).optional()
});
