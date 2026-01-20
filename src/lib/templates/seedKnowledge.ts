import { prisma } from "@/lib/prisma";
import { generateStarterKnowledge, type TemplateApplicationInput } from "./applyTemplate";
import crypto from "crypto";

const TEMPLATE_TITLE_PREFIX = "Template:";

function computeContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 32);
}

export interface SeedKnowledgeResult {
  created: number;
  skipped: number;
  titles: string[];
}

/**
 * Seeds template-generated knowledge sources for a bot.
 *
 * Dedup logic (bot-scoped, safe for multi-tenant):
 * 1. Primary: Skip if (botId, contentHash) already exists (DB-enforced unique).
 * 2. Secondary: Skip if (botId, title) already exists AND title starts with "Template:".
 *    This prevents duplicate template entries but allows user-added KB with same title.
 */
export async function seedTemplateKnowledge(
  botId: number,
  organizationId: number,
  templateKey: string | undefined,
  input: TemplateApplicationInput
): Promise<SeedKnowledgeResult> {
  const sources = generateStarterKnowledge(templateKey, input);

  if (sources.length === 0) {
    return { created: 0, skipped: 0, titles: [] };
  }

  let created = 0;
  let skipped = 0;
  const titles: string[] = [];

  for (const source of sources) {
    const contentHash = computeContentHash(source.content);
    const isTemplateTitle = source.title.startsWith(TEMPLATE_TITLE_PREFIX);

    // Primary dedup: Check if exact content already exists for THIS bot
    const existingByHash = await prisma.botKnowledgeSource.findFirst({
      where: {
        botId,
        contentHash,
      },
    });

    if (existingByHash) {
      skipped++;
      continue;
    }

    // Secondary dedup: Only check title collision for template-prefixed entries
    // This prevents duplicate template KB but allows user KB with same title
    if (isTemplateTitle) {
      const existingByTitle = await prisma.botKnowledgeSource.findFirst({
        where: {
          botId,
          title: source.title,
        },
      });

      if (existingByTitle) {
        skipped++;
        continue;
      }
    }

    await prisma.botKnowledgeSource.create({
      data: {
        botId,
        organizationId,
        type: "PASTE",
        title: source.title,
        content: source.content,
        contentHash,
      },
    });

    titles.push(source.title);
    created++;
  }

  return { created, skipped, titles };
}

export function isTemplateKnowledgeTitle(title: string): boolean {
  return title.startsWith(TEMPLATE_TITLE_PREFIX);
}
