import { z } from "zod";

export const InsightsQuerySchema = z.object({
  botPublicKey: z.string().uuid("Invalid bot public key"),
  days: z.coerce.number().int().min(1).max(90).optional().default(30),
});

export type InsightsQuery = z.infer<typeof InsightsQuerySchema>;

export const InsightsResponseSchema = z.object({
  ok: z.literal(true),
  botPublicKey: z.string().uuid(),
  rangeDays: z.number(),
  totals: z.object({
    chats: z.number(),
    missingDataEvents: z.number(),
    leadCaptureTriggered: z.number(),
    redirectClicks: z.number(),
  }),
  topMissingFields: z
    .array(
      z.object({
        field: z.string(),
        count: z.number(),
      })
    )
    .default([]),
  topTopics: z
    .array(
      z.object({
        topic: z.string(),
        count: z.number(),
      })
    )
    .default([]),
  sampleQuestions: z
    .array(
      z.object({
        message: z.string(),
        createdAt: z.string(),
        topic: z.string().optional(),
        missingFields: z.array(z.string()).optional(),
      })
    )
    .default([]),
  suggestions: z
    .array(
      z.object({
        title: z.string(),
        reason: z.string(),
        suggestedFields: z.array(z.string()),
        exampleValues: z.any().optional(),
      })
    )
    .default([]),
});

export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;
