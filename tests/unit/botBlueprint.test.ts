import { describe, it, expect } from "vitest";
import { buildBotBlueprint, BotBlueprint } from "@/lib/onboarding/botBlueprint";
import type { OnboardingFormData } from "@/lib/onboarding/schemas";

describe("buildBotBlueprint", () => {
  const baseInput: OnboardingFormData = {
    businessName: "Acme Dental",
    category: "Dental Practice",
    websiteUrl: "https://acmedental.com",
    bookingUrl: "https://calendly.com/acme",
    phone: "+1 (555) 123-4567",
    address: "123 Main St, Tampa, FL 33601",
    hours: "Mon-Fri 9am-5pm",
    brandVoice: "professional",
    primaryGoal: "bookings",
  };

  it("generates deterministic bot name from business name", () => {
    const result = buildBotBlueprint(baseInput);
    expect(result.botName).toBe("Acme Dental Assistant");
  });

  it("produces stable output for same input", () => {
    const result1 = buildBotBlueprint(baseInput);
    const result2 = buildBotBlueprint(baseInput);
    expect(result1).toEqual(result2);
  });

  it("includes all required fields in blueprint", () => {
    const result = buildBotBlueprint(baseInput);
    expect(result).toHaveProperty("botName");
    expect(result).toHaveProperty("greeting");
    expect(result).toHaveProperty("fallbackText");
    expect(result).toHaveProperty("systemPrompt");
    expect(result).toHaveProperty("leadCaptureDefaults");
    expect(result).toHaveProperty("recommendedFAQs");
  });

  it("includes lead capture fields", () => {
    const result = buildBotBlueprint(baseInput);
    expect(result.leadCaptureDefaults.fields).toContain("name");
    expect(result.leadCaptureDefaults.fields).toContain("email");
    expect(result.leadCaptureDefaults.fields).toContain("phone");
    expect(result.leadCaptureDefaults.promptText).toBeTruthy();
  });

  describe("brand voice variations", () => {
    const voices = ["professional", "friendly", "luxury", "bold", "chill"] as const;

    voices.forEach((voice) => {
      it(`generates greeting for ${voice} voice`, () => {
        const input: OnboardingFormData = { ...baseInput, brandVoice: voice };
        const result = buildBotBlueprint(input);
        expect(result.greeting).toContain("Acme Dental");
        expect(result.greeting.length).toBeGreaterThan(10);
      });

      it(`generates fallback for ${voice} voice`, () => {
        const input: OnboardingFormData = { ...baseInput, brandVoice: voice };
        const result = buildBotBlueprint(input);
        expect(result.fallbackText.length).toBeGreaterThan(10);
      });
    });
  });

  describe("primary goal variations", () => {
    const goals = ["bookings", "leads", "faqs", "support"] as const;

    goals.forEach((goal) => {
      it(`includes goal-specific FAQs for ${goal}`, () => {
        const input: OnboardingFormData = { ...baseInput, primaryGoal: goal };
        const result = buildBotBlueprint(input);
        expect(result.recommendedFAQs.length).toBeGreaterThan(3);
      });

      it(`system prompt mentions ${goal} objective`, () => {
        const input: OnboardingFormData = { ...baseInput, primaryGoal: goal };
        const result = buildBotBlueprint(input);
        expect(result.systemPrompt).toContain("PRIMARY OBJECTIVE");
      });
    });
  });

  it("system prompt includes business info when provided", () => {
    const result = buildBotBlueprint(baseInput);
    expect(result.systemPrompt).toContain(baseInput.phone!);
    expect(result.systemPrompt).toContain(baseInput.address!);
    expect(result.systemPrompt).toContain(baseInput.hours!);
    expect(result.systemPrompt).toContain(baseInput.websiteUrl!);
    expect(result.systemPrompt).toContain(baseInput.bookingUrl!);
  });

  it("system prompt handles missing optional fields", () => {
    const minimalInput: OnboardingFormData = {
      businessName: "Quick Biz",
      category: "Retail",
      brandVoice: "friendly",
      primaryGoal: "leads",
    };
    const result = buildBotBlueprint(minimalInput);
    expect(result.botName).toBe("Quick Biz Assistant");
    expect(result.systemPrompt).toContain("Quick Biz");
    expect(result.systemPrompt).not.toContain("undefined");
  });

  it("system prompt includes Truth Mode rules", () => {
    const result = buildBotBlueprint(baseInput);
    expect(result.systemPrompt).toContain("TRUTH MODE");
    expect(result.systemPrompt).toContain("Never make up information");
  });

  it("different businesses produce different bot names", () => {
    const input1: OnboardingFormData = { ...baseInput, businessName: "Alpha Co" };
    const input2: OnboardingFormData = { ...baseInput, businessName: "Beta Inc" };
    const result1 = buildBotBlueprint(input1);
    const result2 = buildBotBlueprint(input2);
    expect(result1.botName).not.toBe(result2.botName);
  });
});
