import { z } from "zod";

export const BrandVoice = z.enum(["professional", "friendly", "luxury", "bold", "chill"]);
export type BrandVoice = z.infer<typeof BrandVoice>;

export const PrimaryGoal = z.enum(["bookings", "leads", "faqs", "support"]);
export type PrimaryGoal = z.infer<typeof PrimaryGoal>;

export const CreateClientSchema = z.object({
  orgName: z.string().min(1, "Organization name is required").max(200),
  ownerClerkUserId: z.string().min(1, "Owner user ID is required").max(128),
  clientEmail: z.string().email().optional().or(z.literal("")),
  businessName: z.string().min(1, "Business name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  hours: z.string().max(500).optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  bookingUrl: z.string().url().optional().or(z.literal("")),
  tone: BrandVoice,
  primaryGoal: PrimaryGoal,
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;

export const CreateClientResponseSchema = z.object({
  ok: z.literal(true),
  orgId: z.number(),
  orgPublicId: z.string().uuid(),
  botPublicKey: z.string().uuid(),
  embedSnippet: z.string(),
  iframeSnippet: z.string(),
  nextSteps: z.string(),
});

export type CreateClientResponse = z.infer<typeof CreateClientResponseSchema>;

export const CreateInviteSchema = z.object({
  role: z.enum(["CLIENT", "AGENCY_ADMIN"]).default("CLIENT"),
});

export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

export const CreateInviteResponseSchema = z.object({
  ok: z.literal(true),
  inviteLink: z.string().url(),
  expiresAt: z.string(),
});

export type CreateInviteResponse = z.infer<typeof CreateInviteResponseSchema>;
