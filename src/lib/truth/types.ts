import { z } from "zod";

export const TopicSchema = z.enum([
  "HOURS",
  "SERVICES",
  "PRICING",
  "LOCATION",
  "CONTACT",
  "BOOKING",
  "PAYMENT",
  "POLICIES",
  "GENERAL",
]);

export type Topic = z.infer<typeof TopicSchema>;

export const TruthIntentSchema = z.enum([
  "ANSWERED_FROM_PROFILE",
  "MISSING_DATA",
  "BOOK_OR_PAY_REDIRECT",
  "LEAD_CAPTURE",
]);

export type TruthIntent = z.infer<typeof TruthIntentSchema>;

export const SuggestedActionSchema = z.object({
  type: z.enum(["BOOK", "PAY", "CONTACT"]),
  url: z.string().optional(),
  label: z.string(),
});

export type SuggestedAction = z.infer<typeof SuggestedActionSchema>;

export const TruthResultSchema = z.object({
  reply: z.string(),
  intent: TruthIntentSchema,
  confidence: z.number().min(0).max(1),
  sourcedFrom: z.array(z.string()),
  requiresLeadCapture: z.boolean(),
  missingFields: z.array(z.string()),
  topic: TopicSchema,
  suggestedActions: z.array(SuggestedActionSchema).optional(),
});

export type TruthResult = z.infer<typeof TruthResultSchema>;

export const TopicResultSchema = z.object({
  topic: TopicSchema,
  confidence: z.number().min(0).max(1),
  matched: z.array(z.string()),
});

export type TopicResult = z.infer<typeof TopicResultSchema>;
