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
