import { describe, it, expect } from "vitest";
import { evaluateSetup, SetupInput } from "@/lib/setup/setupChecker";

function makeInput(overrides: Partial<SetupInput> = {}): SetupInput {
  return {
    bot: null,
    businessProfile: null,
    org: {
      notificationEnabled: false,
      notificationEmails: [],
      customBranding: null,
      allowedDomains: [],
    },
    kb: {
      totalArticles: 0,
      publishedArticles: 0,
    },
    hasLeads: false,
    ...overrides,
  };
}

describe("evaluateSetup", () => {
  it("returns getting-started tier for empty org", () => {
    const result = evaluateSetup(makeInput());
    expect(result.tier).toBe("getting-started");
    expect(result.percentComplete).toBeLessThan(40);
    expect(result.nextAction).toBeDefined();
    expect(result.nextAction?.id).toBe("bot-created");
  });

  it("marks bot-created as complete when bot exists", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Hello!",
          fallbackText: null,
          businessPhone: null,
          businessEmail: null,
          businessAddress: null,
          hours: null,
          services: null,
          bookingUrl: null,
          industryTemplate: null,
        },
      })
    );
    const botItem = result.items.find((i) => i.id === "bot-created");
    expect(botItem?.completed).toBe(true);
  });

  it("marks greeting as complete with valid greeting", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Hello! Welcome to our store.",
          fallbackText: null,
          businessPhone: null,
          businessEmail: null,
          businessAddress: null,
          hours: null,
          services: null,
          bookingUrl: null,
          industryTemplate: null,
        },
      })
    );
    const greetingItem = result.items.find((i) => i.id === "greeting-set");
    expect(greetingItem?.completed).toBe(true);
  });

  it("marks services as complete when services exist", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Hello!",
          fallbackText: null,
          businessPhone: null,
          businessEmail: null,
          businessAddress: null,
          hours: null,
          services: [{ name: "Haircut", price: 25 }],
          bookingUrl: null,
          industryTemplate: null,
        },
      })
    );
    const servicesItem = result.items.find((i) => i.id === "services-added");
    expect(servicesItem?.completed).toBe(true);
  });

  it("marks hours as complete when valid hours exist", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Hello!",
          fallbackText: null,
          businessPhone: null,
          businessEmail: null,
          businessAddress: null,
          hours: { monday: { open: "09:00", close: "17:00" } },
          services: null,
          bookingUrl: null,
          industryTemplate: null,
        },
      })
    );
    const hoursItem = result.items.find((i) => i.id === "hours-set");
    expect(hoursItem?.completed).toBe(true);
  });

  it("marks notifications as complete when enabled with emails", () => {
    const result = evaluateSetup(
      makeInput({
        org: {
          notificationEnabled: true,
          notificationEmails: ["test@example.com"],
          customBranding: null,
          allowedDomains: [],
        },
      })
    );
    const notifItem = result.items.find(
      (i) => i.id === "notifications-enabled"
    );
    expect(notifItem?.completed).toBe(true);
  });

  it("returns optimized tier with most items complete", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Welcome to our amazing salon!",
          fallbackText: "Sorry, I don't have that info. Let me get someone.",
          businessPhone: "555-1234",
          businessEmail: "test@example.com",
          businessAddress: "123 Main St",
          hours: { monday: { open: "09:00", close: "17:00" } },
          services: [{ name: "Haircut", price: 25 }],
          bookingUrl: "https://booking.example.com",
          industryTemplate: "barber_shop",
        },
        org: {
          notificationEnabled: true,
          notificationEmails: ["test@example.com"],
          customBranding: null,
          allowedDomains: ["example.com"],
        },
        kb: {
          totalArticles: 5,
          publishedArticles: 3,
        },
        hasLeads: true,
      })
    );
    expect(result.percentComplete).toBeGreaterThanOrEqual(70);
    expect(["optimized", "expert"]).toContain(result.tier);
  });

  it("returns expert tier when 100% complete", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Welcome to our amazing salon!",
          fallbackText: "Sorry, I don't have that info. Let me get someone.",
          businessPhone: "555-1234",
          businessEmail: "test@example.com",
          businessAddress: "123 Main St",
          hours: { monday: { open: "09:00", close: "17:00" } },
          services: [{ name: "Haircut", price: 25 }],
          bookingUrl: "https://booking.example.com",
          industryTemplate: "barber_shop",
        },
        businessProfile: {
          phone: "555-1234",
          address: "123 Main St",
          serviceArea: "Miami-Dade County",
          cancellationPolicy: "24 hour notice required",
          bookingUrl: "https://booking.example.com",
        },
        org: {
          notificationEnabled: true,
          notificationEmails: ["test@example.com"],
          customBranding: null,
          allowedDomains: ["example.com"],
        },
        kb: {
          totalArticles: 5,
          publishedArticles: 3,
        },
        hasLeads: true,
      })
    );
    expect(result.percentComplete).toBe(100);
    expect(result.tier).toBe("expert");
    expect(result.nextAction).toBeNull();
  });

  it("prioritizes critical items in nextAction", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Hello!",
          fallbackText: null,
          businessPhone: null,
          businessEmail: null,
          businessAddress: null,
          hours: { monday: { open: "09:00", close: "17:00" } },
          services: null,
          bookingUrl: null,
          industryTemplate: null,
        },
      })
    );
    expect(result.nextAction?.priority).toBe("critical");
  });

  it("handles JSON string formats for hours and services", () => {
    const result = evaluateSetup(
      makeInput({
        bot: {
          name: "Test Bot",
          greeting: "Hello there welcome!",
          fallbackText: null,
          businessPhone: null,
          businessEmail: null,
          businessAddress: null,
          hours: JSON.stringify({ monday: { open: "09:00", close: "17:00" } }),
          services: JSON.stringify([{ name: "Haircut", price: 25 }]),
          bookingUrl: null,
          industryTemplate: null,
        },
      })
    );
    const hoursItem = result.items.find((i) => i.id === "hours-set");
    const servicesItem = result.items.find((i) => i.id === "services-added");
    expect(hoursItem?.completed).toBe(true);
    expect(servicesItem?.completed).toBe(true);
  });

  it("returns all categories represented in items", () => {
    const result = evaluateSetup(makeInput());
    const categories = new Set(result.items.map((i) => i.category));
    expect(categories).toContain("basics");
    expect(categories).toContain("content");
    expect(categories).toContain("engagement");
    expect(categories).toContain("advanced");
  });

  it("returns unique item ids", () => {
    const result = evaluateSetup(makeInput());
    const ids = result.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
