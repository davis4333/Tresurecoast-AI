import { describe, it, expect } from "vitest";
import { CreateClientSchema, CreateInviteSchema } from "@/lib/admin/clientSchemas";

describe("CreateClientSchema", () => {
  const validInput = {
    orgName: "Acme Corp",
    ownerClerkUserId: "user_12345",
    businessName: "Acme Dental",
    category: "Dental Practice",
    phone: "555-1234",
    address: "123 Main St",
    hours: "Mon-Fri 9am-5pm",
    websiteUrl: "https://acme.com",
    bookingUrl: "https://calendly.com/acme",
    tone: "friendly" as const,
    primaryGoal: "bookings" as const,
  };

  it("accepts valid input with all fields", () => {
    const result = CreateClientSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with only required fields", () => {
    const minimal = {
      orgName: "Acme Corp",
      ownerClerkUserId: "user_12345",
      businessName: "Acme Dental",
      category: "Dental Practice",
      tone: "professional",
      primaryGoal: "leads",
    };
    const result = CreateClientSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it("rejects missing orgName", () => {
    const input = { ...validInput, orgName: "" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing ownerClerkUserId", () => {
    const input = { ...validInput, ownerClerkUserId: "" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing businessName", () => {
    const input = { ...validInput, businessName: "" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const input = { ...validInput, category: "" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid tone", () => {
    const input = { ...validInput, tone: "invalid" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid primaryGoal", () => {
    const input = { ...validInput, primaryGoal: "invalid" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty optional URL fields", () => {
    const input = { ...validInput, websiteUrl: "", bookingUrl: "" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL format", () => {
    const input = { ...validInput, websiteUrl: "not-a-url" };
    const result = CreateClientSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid tone values", () => {
    const tones = ["professional", "friendly", "luxury", "bold", "chill"];
    for (const tone of tones) {
      const result = CreateClientSchema.safeParse({ ...validInput, tone });
      expect(result.success, `tone ${tone} should be valid`).toBe(true);
    }
  });

  it("accepts all valid primaryGoal values", () => {
    const goals = ["bookings", "leads", "faqs", "support"];
    for (const goal of goals) {
      const result = CreateClientSchema.safeParse({ ...validInput, primaryGoal: goal });
      expect(result.success, `goal ${goal} should be valid`).toBe(true);
    }
  });
});

describe("CreateInviteSchema", () => {
  it("accepts valid CLIENT role", () => {
    const result = CreateInviteSchema.safeParse({ role: "CLIENT" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("CLIENT");
    }
  });

  it("accepts valid AGENCY_ADMIN role", () => {
    const result = CreateInviteSchema.safeParse({ role: "AGENCY_ADMIN" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("AGENCY_ADMIN");
    }
  });

  it("defaults to CLIENT when role not provided", () => {
    const result = CreateInviteSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("CLIENT");
    }
  });

  it("rejects invalid role", () => {
    const result = CreateInviteSchema.safeParse({ role: "SUPER_ADMIN" });
    expect(result.success).toBe(false);
  });
});
