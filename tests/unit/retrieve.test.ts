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
