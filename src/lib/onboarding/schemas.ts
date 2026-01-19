import { z } from "zod";
import { TEMPLATE_KEYS } from "../templates";

export const BrandVoice = z.enum(["professional", "friendly", "luxury", "bold", "chill"]);
export type BrandVoice = z.infer<typeof BrandVoice>;

export const PrimaryGoal = z.enum(["bookings", "leads", "faqs", "support"]);
export type PrimaryGoal = z.infer<typeof PrimaryGoal>;

export const TemplateKeySchema = z.enum(TEMPLATE_KEYS);

export const OnboardingFormSchema = z.object({
  templateKey: TemplateKeySchema.default("universal_blank"),
  businessName: z.string().min(1, "Business name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  bookingUrl: z.string().url().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  hours: z.string().max(500).optional().or(z.literal("")),
  brandVoice: BrandVoice,
  primaryGoal: PrimaryGoal,
});

export type OnboardingFormData = z.infer<typeof OnboardingFormSchema>;

export const GenerateResponseSchema = z.object({
  ok: z.literal(true),
  botPublicKey: z.string().uuid(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
