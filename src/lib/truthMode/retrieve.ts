import { prisma } from "@/lib/prisma";
import type { RetrievalResult, RetrievalHit } from "./schemas";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const MIN_SCORE_THRESHOLD = 0.1;
const MIN_EVIDENCE_SCORE = 0.3;
const TOP_K = 3;

interface Chunk {
  text: string;
  sourceId: number;
  title: string;
}

function splitIntoChunks(content: string, sourceId: number, title: string): Chunk[] {
  const chunks: Chunk[] = [];
  const text = content.trim();
  
  if (text.length <= CHUNK_SIZE) {
    chunks.push({ text, sourceId, title });
    return chunks;
  }

  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);
    
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + CHUNK_SIZE / 2) {
        end = breakPoint + 1;
      }
    }

    const chunkText = text.slice(start, end).trim();
    if (chunkText.length > 0) {
      chunks.push({ text: chunkText, sourceId, title });
    }

    start = end - CHUNK_OVERLAP;
    if (start >= text.length) break;
  }

  return chunks;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildTermFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function calculateTfIdfScore(queryTokens: string[], chunkTokens: string[]): number {
  if (queryTokens.length === 0 || chunkTokens.length === 0) return 0;

  const chunkTf = buildTermFrequency(chunkTokens);
  const chunkSet = new Set(chunkTokens);
  
  let matchedTerms = 0;
  let tfSum = 0;

  for (const term of queryTokens) {
    if (chunkSet.has(term)) {
      matchedTerms++;
      tfSum += chunkTf.get(term) || 0;
    }
  }

  if (matchedTerms === 0) return 0;

  const coverage = matchedTerms / queryTokens.length;
  const density = tfSum / chunkTokens.length;
  
  return coverage * 0.7 + density * 0.3;
}

function scoreChunks(question: string, chunks: Chunk[]): RetrievalHit[] {
  const queryTokens = tokenize(question);
  
  const scored: RetrievalHit[] = chunks.map((chunk) => {
    const chunkTokens = tokenize(chunk.text);
    const score = calculateTfIdfScore(queryTokens, chunkTokens);
    return {
      text: chunk.text,
      title: chunk.title,
      sourceId: chunk.sourceId,
      score,
    };
  });

  return scored
    .filter((hit) => hit.score >= MIN_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

export async function retrieve(
  botId: number,
  orgId: number,
  question: string
): Promise<RetrievalResult> {
  const sources = await prisma.botKnowledgeSource.findMany({
    where: { botId, organizationId: orgId },
    select: { id: true, title: true, content: true },
  });

  if (sources.length === 0) {
    return { hits: [], hasEnoughEvidence: false };
  }

  const allChunks: Chunk[] = [];
  for (const source of sources) {
    const chunks = splitIntoChunks(source.content, source.id, source.title);
    allChunks.push(...chunks);
  }

  const hits = scoreChunks(question, allChunks);
  
  const topScore = hits[0]?.score ?? 0;
  const hasEnoughEvidence = hits.length > 0 && topScore >= MIN_EVIDENCE_SCORE;

  return { hits, hasEnoughEvidence };
}

export function formatCitedAnswer(hits: RetrievalHit[], fallbackText: string): string {
  if (hits.length === 0) {
    return fallbackText;
  }

  const uniqueTitles = [...new Set(hits.map((h) => h.title))];
  const contextParts = hits.map((h) => h.text).join("\n\n");
  const citations = uniqueTitles.map((t) => `(Source: ${t})`).join(" ");

  return `Based on the information available:\n\n${contextParts}\n\n${citations}`;
}
