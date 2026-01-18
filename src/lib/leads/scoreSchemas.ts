import { z } from "zod";

export const LeadScoreInputSchema = z.object({
  lead: z.object({
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    service: z.string().nullable().optional(),
    preferredTime: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
  }),
  signals: z
    .object({
      topic: z.string().optional(),
      requiresLeadCapture: z.boolean().optional(),
      missingFields: z.array(z.string()).optional(),
      suggestedActions: z
        .array(
          z.object({
            type: z.enum(["BOOK", "PAY", "CONTACT"]),
            url: z.string().optional(),
            label: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type LeadScoreInput = z.infer<typeof LeadScoreInputSchema>;

export const LeadScoreResultSchema = z.object({
  score: z.number().int().min(0).max(100),
  temperature: z.enum(["HOT", "WARM", "COLD"]),
  reasons: z.array(z.string()),
});

export type LeadScoreResult = z.infer<typeof LeadScoreResultSchema>;
