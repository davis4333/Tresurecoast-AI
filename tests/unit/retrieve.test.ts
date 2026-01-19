import { describe, it, expect } from "vitest";
import { CreateKnowledgeSourceSchema } from "@/lib/truthMode/schemas";

describe("CreateKnowledgeSourceSchema", () => {
  describe("title validation", () => {
    it("rejects empty title", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "",
        content: "A".repeat(100),
      });
      expect(result.success).toBe(false);
    });

    it("rejects title over 120 characters", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "A".repeat(121),
        content: "B".repeat(100),
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid title", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "Services and Pricing",
        content: "C".repeat(100),
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Services and Pricing");
    });

    it("trims whitespace from title", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "  My Title  ",
        content: "D".repeat(100),
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("My Title");
    });
  });

  describe("content validation", () => {
    it("rejects content under 100 characters", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "Valid Title",
        content: "A".repeat(99),
      });
      expect(result.success).toBe(false);
    });

    it("rejects content over 50000 characters", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "Valid Title",
        content: "B".repeat(50001),
      });
      expect(result.success).toBe(false);
    });

    it("accepts content exactly 100 characters", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "Valid Title",
        content: "C".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("accepts content exactly 50000 characters", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "Valid Title",
        content: "D".repeat(50000),
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from content", () => {
      const result = CreateKnowledgeSourceSchema.safeParse({
        title: "Valid Title",
        content: "  " + "E".repeat(100) + "  ",
      });
      expect(result.success).toBe(true);
      expect(result.data?.content).toBe("E".repeat(100));
    });
  });
});

describe("TF-IDF Retrieval Logic", () => {
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

  it("tokenizes text correctly", () => {
    const tokens = tokenize("Hello, world! This is a test.");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
    expect(tokens).toContain("this");
    expect(tokens).toContain("test");
    expect(tokens).not.toContain("is");
    expect(tokens).not.toContain("a");
  });

  it("calculates higher score for better matches", () => {
    const queryTokens = tokenize("What are your business hours?");
    const goodMatch = tokenize("Our business hours are Monday to Friday 9am to 5pm.");
    const poorMatch = tokenize("We offer various services for customers.");

    const goodScore = calculateTfIdfScore(queryTokens, goodMatch);
    const poorScore = calculateTfIdfScore(queryTokens, poorMatch);

    expect(goodScore).toBeGreaterThan(poorScore);
  });

  it("returns zero for no matches", () => {
    const queryTokens = tokenize("What is the price?");
    const chunkTokens = tokenize("Contact us for more information.");

    const score = calculateTfIdfScore(queryTokens, chunkTokens);
    expect(score).toBe(0);
  });

  it("handles empty inputs", () => {
    expect(calculateTfIdfScore([], tokenize("some text"))).toBe(0);
    expect(calculateTfIdfScore(tokenize("query"), [])).toBe(0);
  });

  it("builds term frequency correctly", () => {
    const tokens = ["hello", "world", "hello", "test"];
    const tf = buildTermFrequency(tokens);
    expect(tf.get("hello")).toBe(2);
    expect(tf.get("world")).toBe(1);
    expect(tf.get("test")).toBe(1);
  });
});

describe("Rare Token Exact Match", () => {
  function extractRareTokens(text: string): string[] {
    const matches = text.match(/[A-Za-z0-9_-]{12,}/g) || [];
    return matches.map((m) => m.toLowerCase());
  }

  interface Chunk {
    text: string;
    sourceId: number;
    title: string;
  }

  interface Hit {
    text: string;
    title: string;
    sourceId: number;
    score: number;
  }

  function findChunkWithRareToken(
    rareTokens: string[],
    chunks: Chunk[]
  ): Hit | null {
    for (const token of rareTokens) {
      for (const chunk of chunks) {
        if (chunk.text.toLowerCase().includes(token)) {
          return {
            text: chunk.text,
            title: chunk.title,
            sourceId: chunk.sourceId,
            score: 1.0,
          };
        }
      }
    }
    return null;
  }

  it("extracts rare tokens (12+ chars) from query", () => {
    const query = "Tell me about UNIQUEKB_TEST_TOKEN_12345";
    const rareTokens = extractRareTokens(query);
    expect(rareTokens).toContain("uniquekb_test_token_12345");
    expect(rareTokens.length).toBe(1);
  });

  it("extracts multiple rare tokens", () => {
    const query = "Compare ALPHANUMERIC123 with BETANUMERIC456";
    const rareTokens = extractRareTokens(query);
    expect(rareTokens).toContain("alphanumeric123");
    expect(rareTokens).toContain("betanumeric456");
    expect(rareTokens.length).toBe(2);
  });

  it("ignores short tokens", () => {
    const query = "What is the short code ABC123?";
    const rareTokens = extractRareTokens(query);
    expect(rareTokens.length).toBe(0);
  });

  it("finds chunk containing rare token", () => {
    const chunks: Chunk[] = [
      { text: "General info about services", sourceId: 1, title: "Services" },
      { text: "Our special code is UNIQUEKB_TEST_TOKEN_12345 for premium users", sourceId: 2, title: "Premium" },
      { text: "Contact us for support", sourceId: 3, title: "Contact" },
    ];
    const rareTokens = extractRareTokens("Tell me about UNIQUEKB_TEST_TOKEN_12345");
    const hit = findChunkWithRareToken(rareTokens, chunks);

    expect(hit).not.toBeNull();
    expect(hit?.score).toBe(1.0);
    expect(hit?.title).toBe("Premium");
    expect(hit?.text).toContain("UNIQUEKB_TEST_TOKEN_12345");
  });

  it("returns null when rare token not found in any chunk", () => {
    const chunks: Chunk[] = [
      { text: "General info about services", sourceId: 1, title: "Services" },
      { text: "Contact us for support", sourceId: 3, title: "Contact" },
    ];
    const rareTokens = extractRareTokens("Tell me about UNIQUEKB_MISSING_TOKEN");
    const hit = findChunkWithRareToken(rareTokens, chunks);

    expect(hit).toBeNull();
  });

  it("matches case-insensitively", () => {
    const chunks: Chunk[] = [
      { text: "The token uniquekb_lowercase_test is valid", sourceId: 1, title: "Test" },
    ];
    const rareTokens = extractRareTokens("What is UNIQUEKB_LOWERCASE_TEST?");
    const hit = findChunkWithRareToken(rareTokens, chunks);

    expect(hit).not.toBeNull();
    expect(hit?.score).toBe(1.0);
  });
});
