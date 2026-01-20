import { describe, it, expect } from "vitest";
import {
  dollarsToCents,
  centsToDollars,
  centsToInput,
  normalizeUrl,
  isValidUrl,
  truncateUrl,
  reorderItems,
  compactDisplayOrder,
} from "@/lib/validators/serviceHelpers";

describe("dollarsToCents", () => {
  it("converts string dollar amount to cents", () => {
    expect(dollarsToCents("10.50")).toBe(1050);
    expect(dollarsToCents("100")).toBe(10000);
    expect(dollarsToCents("0.99")).toBe(99);
  });

  it("converts number to cents", () => {
    expect(dollarsToCents(10.5)).toBe(1050);
    expect(dollarsToCents(100)).toBe(10000);
    expect(dollarsToCents(0.99)).toBe(99);
  });

  it("handles dollar sign in input", () => {
    expect(dollarsToCents("$10.50")).toBe(1050);
    expect(dollarsToCents("$100")).toBe(10000);
  });

  it("handles comma separators", () => {
    expect(dollarsToCents("1,000.50")).toBe(100050);
    expect(dollarsToCents("$1,000")).toBe(100000);
  });

  it("returns null for empty/null/undefined", () => {
    expect(dollarsToCents(null)).toBeNull();
    expect(dollarsToCents(undefined)).toBeNull();
    expect(dollarsToCents("")).toBeNull();
    expect(dollarsToCents("   ")).toBeNull();
  });

  it("returns null for invalid values", () => {
    expect(dollarsToCents("abc")).toBeNull();
    expect(dollarsToCents("NaN")).toBeNull();
    expect(dollarsToCents(-10)).toBeNull();
  });

  it("rounds to nearest cent", () => {
    expect(dollarsToCents("10.555")).toBe(1056);
    expect(dollarsToCents("10.554")).toBe(1055);
  });
});

describe("centsToDollars", () => {
  it("formats cents as currency", () => {
    expect(centsToDollars(1050)).toBe("$10.50");
    expect(centsToDollars(10000)).toBe("$100.00");
    expect(centsToDollars(99)).toBe("$0.99");
  });

  it("handles thousands separator", () => {
    expect(centsToDollars(100050)).toBe("$1,000.50");
  });

  it("returns empty string for null/undefined", () => {
    expect(centsToDollars(null)).toBe("");
    expect(centsToDollars(undefined)).toBe("");
  });

  it("handles zero", () => {
    expect(centsToDollars(0)).toBe("$0.00");
  });
});

describe("centsToInput", () => {
  it("formats cents for input field without dollar sign", () => {
    expect(centsToInput(1050)).toBe("10.50");
    expect(centsToInput(10000)).toBe("100.00");
    expect(centsToInput(99)).toBe("0.99");
  });

  it("returns empty string for null/undefined", () => {
    expect(centsToInput(null)).toBe("");
    expect(centsToInput(undefined)).toBe("");
  });
});

describe("normalizeUrl", () => {
  it("trims and returns valid URLs", () => {
    expect(normalizeUrl("  https://example.com  ")).toBe("https://example.com");
    expect(normalizeUrl("https://book.example.com/page")).toBe("https://book.example.com/page");
  });

  it("returns null for empty/null/undefined", () => {
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(normalizeUrl("not-a-url")).toBeNull();
    expect(normalizeUrl("ftp//missing-colon")).toBeNull();
  });
});

describe("isValidUrl", () => {
  it("returns true for valid URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });

  it("returns true for empty values (optional field)", () => {
    expect(isValidUrl(null)).toBe(true);
    expect(isValidUrl(undefined)).toBe(true);
    expect(isValidUrl("")).toBe(true);
    expect(isValidUrl("   ")).toBe(true);
  });

  it("returns false for invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("example.com")).toBe(false);
  });
});

describe("truncateUrl", () => {
  it("truncates long URLs with ellipsis", () => {
    const longUrl = "https://example.com/very/long/path/to/resource";
    expect(truncateUrl(longUrl, 30)).toBe("https://example.com/very/lo...");
  });

  it("returns short URLs unchanged", () => {
    expect(truncateUrl("https://x.co", 30)).toBe("https://x.co");
  });

  it("returns empty string for null/undefined", () => {
    expect(truncateUrl(null)).toBe("");
    expect(truncateUrl(undefined)).toBe("");
  });
});

describe("reorderItems", () => {
  const items = [
    { id: 1, displayOrder: 0 },
    { id: 2, displayOrder: 1 },
    { id: 3, displayOrder: 2 },
  ];

  it("moves item down in list", () => {
    const result = reorderItems(items, 0, 2);
    expect(result.map(i => i.id)).toEqual([2, 3, 1]);
    expect(result.map(i => i.displayOrder)).toEqual([0, 1, 2]);
  });

  it("moves item up in list", () => {
    const result = reorderItems(items, 2, 0);
    expect(result.map(i => i.id)).toEqual([3, 1, 2]);
    expect(result.map(i => i.displayOrder)).toEqual([0, 1, 2]);
  });

  it("returns original for same index", () => {
    const result = reorderItems(items, 1, 1);
    expect(result).toEqual(items);
  });

  it("returns original for invalid indices", () => {
    expect(reorderItems(items, -1, 1)).toEqual(items);
    expect(reorderItems(items, 0, 10)).toEqual(items);
  });
});

describe("compactDisplayOrder", () => {
  it("compacts non-sequential display orders", () => {
    const items = [
      { id: 1, displayOrder: 5 },
      { id: 2, displayOrder: 0 },
      { id: 3, displayOrder: 10 },
    ];
    const result = compactDisplayOrder(items);
    expect(result.map(i => i.displayOrder)).toEqual([0, 1, 2]);
    expect(result.map(i => i.id)).toEqual([2, 1, 3]);
  });

  it("handles already compact orders", () => {
    const items = [
      { id: 1, displayOrder: 0 },
      { id: 2, displayOrder: 1 },
    ];
    const result = compactDisplayOrder(items);
    expect(result.map(i => i.displayOrder)).toEqual([0, 1]);
  });
});
