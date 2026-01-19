import { z } from "zod";

export const KnowledgeSourceTypeSchema = z.enum(["PASTE", "URL"]);
export type KnowledgeSourceType = z.infer<typeof KnowledgeSourceTypeSchema>;

export const CreateKnowledgeSourceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(120, "Title must be 120 characters or less")
    .transform((s) => s.trim()),
  content: z
    .string()
    .min(100, "Content must be at least 100 characters")
    .max(50000, "Content must be 50,000 characters or less")
    .transform((s) => s.trim()),
});

export type CreateKnowledgeSourceInput = z.infer<typeof CreateKnowledgeSourceSchema>;

export interface KnowledgeSourceResponse {
  id: number;
  title: string;
  type: string;
  createdAt: string;
}

export interface RetrievalHit {
  text: string;
  title: string;
  sourceId: number;
  score: number;
}

export interface RetrievalResult {
  hits: RetrievalHit[];
  hasEnoughEvidence: boolean;
}
