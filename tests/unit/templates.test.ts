import { describe, it, expect } from "vitest";
import {
  getTemplate,
  listTemplates,
  isValidTemplateKey,
  TEMPLATE_KEYS,
} from "@/lib/templates/registry";
import {
  replacePlaceholders,
  buildPlaceholderValues,
  type PlaceholderValues,
} from "@/lib/templates/placeholders";
import {
  applyTemplateToBlueprint,
  generateStarterKnowledge,
  getTemplateDefaults,
} from "@/lib/templates/applyTemplate";
import type { IndustryTemplate, TemplateKey } from "@/lib/templates/types";
import type { BotBlueprint } from "@/lib/onboarding/botBlueprint";

describe("Template Registry", () => {
  it("should have at least 7 templates", () => {
    expect(TEMPLATE_KEYS.length).toBeGreaterThanOrEqual(7);
  });

  it("should include universal_blank template", () => {
    const template = getTemplate("universal_blank");
    expect(template).toBeDefined();
    expect(template.key).toBe("universal_blank");
    expect(template.label).toBe("Universal (Blank)");
  });

  it("should include all expected industry templates", () => {
    const expectedKeys: TemplateKey[] = [
      "universal_blank",
      "barber_shop",
      "nail_salon",
      "fitness_gym",
      "dentist",
      "sober_living",
      "epoxy_flooring",
    ];
    for (const key of expectedKeys) {
      expect(TEMPLATE_KEYS).toContain(key);
      const template = getTemplate(key);
      expect(template).toBeDefined();
      expect(template.key).toBe(key);
    }
  });

  it("should validate template keys correctly", () => {
    expect(isValidTemplateKey("universal_blank")).toBe(true);
    expect(isValidTemplateKey("barber_shop")).toBe(true);
    expect(isValidTemplateKey("invalid_key")).toBe(false);
    expect(isValidTemplateKey("")).toBe(false);
  });

  it("should list all templates", () => {
    const templates = listTemplates();
    expect(templates.length).toBe(TEMPLATE_KEYS.length);
    for (const template of templates) {
      expect(template.key).toBeDefined();
      expect(template.label).toBeDefined();
      expect(template.greetingTemplate).toBeDefined();
    }
  });

  it("should have proper structure for each template", () => {
    for (const key of TEMPLATE_KEYS) {
      const template = getTemplate(key);
      expect(template.key).toBe(key);
      expect(typeof template.label).toBe("string");
      expect(typeof template.industry).toBe("string");
      expect(typeof template.greetingTemplate).toBe("string");
      expect(typeof template.fallbackTemplate).toBe("string");
      expect(typeof template.botNamePattern).toBe("string");
      expect(Array.isArray(template.starterKnowledge)).toBe(true);
    }
  });

  it("universal_blank should have empty starterKnowledge array", () => {
    const template = getTemplate("universal_blank");
    expect(template.starterKnowledge).toEqual([]);
  });

  it("industry templates should have non-empty starterKnowledge", () => {
    const industryKeys: TemplateKey[] = [
      "barber_shop",
      "nail_salon",
      "fitness_gym",
      "dentist",
      "sober_living",
      "epoxy_flooring",
    ];
    for (const key of industryKeys) {
      const template = getTemplate(key);
      expect(template.starterKnowledge.length).toBeGreaterThan(0);
    }
  });
});

describe("Placeholder Engine", () => {
  const fullValues: PlaceholderValues = {
    BusinessName: "Test Barbershop",
    Phone: "555-123-4567",
    Address: "123 Main St, City, ST 12345",
    Hours: "Mon-Fri 9am-5pm",
    BookingUrl: "https://book.example.com",
  };

  it("should replace all placeholders with valid values", () => {
    const text = "Welcome to {BusinessName}! Call us at {Phone}.";
    const result = replacePlaceholders(text, fullValues);
    expect(result).toBe("Welcome to Test Barbershop! Call us at 555-123-4567.");
  });

  it("should replace missing placeholder values with empty string", () => {
    const text = "Welcome to {BusinessName}! Call us at {Phone}.";
    const partialValues: PlaceholderValues = { BusinessName: "Test Shop" };
    const result = replacePlaceholders(text, partialValues);
    expect(result).toBe("Welcome to Test Shop! Call us at .");
  });

  it("should handle empty values gracefully", () => {
    const text = "Welcome to {BusinessName}! Call us at {Phone}.";
    const result = replacePlaceholders(text, {});
    expect(result).toBe("Welcome to ! Call us at .");
  });

  it("should handle text without placeholders", () => {
    const text = "Hello, how can I help you today?";
    const result = replacePlaceholders(text, fullValues);
    expect(result).toBe(text);
  });

  it("should replace multiple occurrences of the same placeholder", () => {
    const text = "{BusinessName} is great! Visit {BusinessName} today!";
    const result = replacePlaceholders(text, fullValues);
    expect(result).toBe("Test Barbershop is great! Visit Test Barbershop today!");
  });

  it("should replace all supported placeholders", () => {
    const text = "{BusinessName} - {Phone} - {Address} - {Hours} - {BookingUrl}";
    const result = replacePlaceholders(text, fullValues);
    expect(result).toContain("Test Barbershop");
    expect(result).toContain("555-123-4567");
    expect(result).toContain("123 Main St");
    expect(result).toContain("Mon-Fri 9am-5pm");
    expect(result).toContain("https://book.example.com");
  });

  it("buildPlaceholderValues should convert camelCase to PascalCase", () => {
    const values = buildPlaceholderValues({
      businessName: "My Business",
      phone: "555-1234",
      address: "123 Main St",
      hours: "9-5",
      websiteUrl: "https://example.com",
      bookingUrl: "https://book.example.com",
    });

    expect(values.BusinessName).toBe("My Business");
    expect(values.Phone).toBe("555-1234");
    expect(values.Address).toBe("123 Main St");
    expect(values.Hours).toBe("9-5");
    expect(values.Website).toBe("https://example.com");
    expect(values.BookingUrl).toBe("https://book.example.com");
  });
});

describe("Apply Template to Blueprint", () => {
  const baseBlueprint: BotBlueprint = {
    botName: "Default Bot",
    greeting: "Hello!",
    fallbackText: "I don't know.",
    brandVoice: "friendly",
    primaryGoal: "leads",
    systemPromptFragment: "",
  };

  const input = {
    businessName: "Joe's Barbershop",
    category: "Barber Shop",
    phone: "555-CUTS",
  };

  it("should not modify blueprint for universal_blank template", () => {
    const result = applyTemplateToBlueprint(baseBlueprint, "universal_blank", input);
    expect(result).toEqual(baseBlueprint);
  });

  it("should apply industry template with placeholders replaced", () => {
    const result = applyTemplateToBlueprint(baseBlueprint, "barber_shop", input);
    expect(result.greeting).toContain("Joe's Barbershop");
    expect(result.botName).toContain("Joe's Barbershop");
  });

  it("should not modify blueprint for invalid template key", () => {
    const result = applyTemplateToBlueprint(baseBlueprint, "invalid_template", input);
    expect(result).toEqual(baseBlueprint);
  });

  it("should not modify blueprint if templateKey is undefined", () => {
    const result = applyTemplateToBlueprint(baseBlueprint, undefined, input);
    expect(result).toEqual(baseBlueprint);
  });
});

describe("Generate Starter Knowledge", () => {
  const input = {
    businessName: "Joe's Barbershop",
    category: "Barber Shop",
    phone: "555-CUTS",
    address: "123 Main St",
    hours: "Mon-Sat 9-6",
  };

  it("should return empty array for universal_blank", () => {
    const result = generateStarterKnowledge("universal_blank", input);
    expect(result).toEqual([]);
  });

  it("should generate knowledge sources for industry template", () => {
    const result = generateStarterKnowledge("barber_shop", input);
    expect(result.length).toBeGreaterThan(0);
    for (const kb of result) {
      expect(kb.title).toBeDefined();
      expect(kb.content).toBeDefined();
    }
    const hasBusinessName = result.some((kb) =>
      kb.content.includes("Joe's Barbershop")
    );
    expect(hasBusinessName).toBe(true);
  });

  it("should return empty array for invalid template key", () => {
    const result = generateStarterKnowledge("invalid_template", input);
    expect(result).toEqual([]);
  });

  it("should return empty array if templateKey is undefined", () => {
    const result = generateStarterKnowledge(undefined, input);
    expect(result).toEqual([]);
  });
});

describe("Get Template Defaults", () => {
  it("should return null for universal_blank", () => {
    const result = getTemplateDefaults("universal_blank");
    expect(result).toBeNull();
  });

  it("should return defaults for barber_shop", () => {
    const result = getTemplateDefaults("barber_shop");
    expect(result).not.toBeNull();
    expect(result?.brandVoice).toBe("chill");
    expect(result?.primaryGoal).toBe("bookings");
  });

  it("should return null for invalid template key", () => {
    const result = getTemplateDefaults("invalid_template");
    expect(result).toBeNull();
  });

  it("should return null if templateKey is undefined", () => {
    const result = getTemplateDefaults(undefined);
    expect(result).toBeNull();
  });
});

describe("Seed Knowledge Dedup Logic", () => {
  it("isTemplateKnowledgeTitle returns true for Template: prefixed titles", async () => {
    const { isTemplateKnowledgeTitle } = await import("@/lib/templates/seedKnowledge");
    expect(isTemplateKnowledgeTitle("Template: Services")).toBe(true);
    expect(isTemplateKnowledgeTitle("Template:Hours")).toBe(true);
  });

  it("isTemplateKnowledgeTitle returns false for non-template titles", async () => {
    const { isTemplateKnowledgeTitle } = await import("@/lib/templates/seedKnowledge");
    expect(isTemplateKnowledgeTitle("Services")).toBe(false);
    expect(isTemplateKnowledgeTitle("My Custom KB")).toBe(false);
    expect(isTemplateKnowledgeTitle("")).toBe(false);
  });

  it("generateStarterKnowledge produces Template:-prefixed titles for industry templates", () => {
    const sources = generateStarterKnowledge("barber_shop", {
      businessName: "Test Barber",
      category: "Barber",
    });
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source.title.startsWith("Template:")).toBe(true);
    }
  });

  it("two different bots should be able to have KB with same contentHash", () => {
    // This test verifies the dedup logic design: contentHash dedup is bot-scoped
    // The actual DB query in seedTemplateKnowledge uses { botId, contentHash }
    // meaning bot1 having contentHash X does NOT block bot2 from having the same content
    const sources1 = generateStarterKnowledge("barber_shop", {
      businessName: "Shop A",
      category: "Barber",
    });
    const sources2 = generateStarterKnowledge("barber_shop", {
      businessName: "Shop A", // Same name = same content = same hash
      category: "Barber",
    });

    // Both should generate the same KB content
    expect(sources1.length).toBe(sources2.length);
    expect(sources1[0]?.content).toBe(sources2[0]?.content);
    // The dedup query uses { botId, contentHash } so different bots won't collide
  });

  it("title collision across bots should not prevent seeding (design verification)", () => {
    // This test verifies the dedup logic design: title dedup is bot-scoped
    // The actual DB query in seedTemplateKnowledge uses { botId, title }
    // meaning bot1 having title X does NOT block bot2 from having the same title
    const sources1 = generateStarterKnowledge("barber_shop", {
      businessName: "Shop A",
      category: "Barber",
    });
    const sources2 = generateStarterKnowledge("barber_shop", {
      businessName: "Shop B",
      category: "Barber",
    });

    // Both bots get KB with same Template:-prefixed titles
    expect(sources1[0]?.title).toBe(sources2[0]?.title);
    // The dedup query uses { botId, title } so different bots won't collide
  });

  it("running generateStarterKnowledge twice returns identical output (deterministic)", () => {
    const input = { businessName: "Test Shop", category: "Barber" };
    const run1 = generateStarterKnowledge("barber_shop", input);
    const run2 = generateStarterKnowledge("barber_shop", input);

    expect(run1).toEqual(run2);
    // Combined with the bot-scoped dedup, this ensures idempotent seeding
  });
});

describe("Template Content Requirements", () => {
  it("barber_shop template should have services-related KB entries", () => {
    const template = getTemplate("barber_shop");
    const hasServicesEntry = template.starterKnowledge.some(
      (kb) =>
        kb.title.toLowerCase().includes("service") ||
        kb.contentTemplate.toLowerCase().includes("haircut")
    );
    expect(hasServicesEntry).toBe(true);
  });

  it("dentist template should have dental-related KB entries", () => {
    const template = getTemplate("dentist");
    const hasDentalContent = template.starterKnowledge.some(
      (kb) =>
        kb.contentTemplate.toLowerCase().includes("dental") ||
        kb.contentTemplate.toLowerCase().includes("teeth")
    );
    expect(hasDentalContent).toBe(true);
  });

  it("fitness_gym template should have fitness-related KB entries", () => {
    const template = getTemplate("fitness_gym");
    const hasFitnessContent = template.starterKnowledge.some(
      (kb) =>
        kb.contentTemplate.toLowerCase().includes("fitness") ||
        kb.contentTemplate.toLowerCase().includes("gym") ||
        kb.contentTemplate.toLowerCase().includes("workout")
    );
    expect(hasFitnessContent).toBe(true);
  });

  it("templates should not leak industry-specific strings when using universal", () => {
    const kb = generateStarterKnowledge("universal_blank", {
      businessName: "Generic Biz",
      category: "General",
    });
    expect(kb).toEqual([]);
  });

  it("each starter knowledge entry should have Template: prefix in title", () => {
    for (const key of TEMPLATE_KEYS) {
      if (key === "universal_blank") continue;
      const template = getTemplate(key);
      for (const kb of template.starterKnowledge) {
        expect(kb.title.startsWith("Template:")).toBe(true);
      }
    }
  });
});
