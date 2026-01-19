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

    const existing = await prisma.botKnowledgeSource.findFirst({
      where: {
        botId,
        OR: [
          { contentHash },
          { title: source.title },
        ],
      },
    });

    if (existing) {
      skipped++;
      continue;
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
