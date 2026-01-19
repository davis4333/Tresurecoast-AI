import { describe, it, expect } from "vitest";
import { DemoRequestSchema } from "../../src/lib/public/demoRequestSchema";

describe("DemoRequestSchema", () => {
  describe("valid inputs", () => {
    it("accepts complete valid input", () => {
      const result = DemoRequestSchema.safeParse({
        name: "John Smith",
        email: "john@example.com",
        businessName: "Acme Corp",
        phone: "555-1234",
      });
      expect(result.success).toBe(true);
    });

    it("accepts input without optional phone", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        businessName: "Test Business",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null phone", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        businessName: "Test Business",
        phone: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = DemoRequestSchema.safeParse({
        name: "",
        email: "test@example.com",
        businessName: "Test",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it("rejects name over 100 characters", () => {
      const result = DemoRequestSchema.safeParse({
        name: "a".repeat(101),
        email: "test@example.com",
        businessName: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("accepts name at 100 characters", () => {
      const result = DemoRequestSchema.safeParse({
        name: "a".repeat(100),
        email: "test@example.com",
        businessName: "Test",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects invalid email format", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "not-an-email",
        businessName: "Test",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it("rejects email without domain", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "test@",
        businessName: "Test",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email over 255 characters", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "a".repeat(250) + "@example.com",
        businessName: "Test",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("businessName validation", () => {
    it("rejects empty businessName", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        businessName: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.businessName).toBeDefined();
      }
    });

    it("rejects businessName over 200 characters", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        businessName: "a".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("phone validation", () => {
    it("rejects phone over 30 characters", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        businessName: "Test",
        phone: "1".repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it("accepts phone at 30 characters", () => {
      const result = DemoRequestSchema.safeParse({
        name: "Test",
        email: "test@example.com",
        businessName: "Test",
        phone: "1".repeat(30),
      });
      expect(result.success).toBe(true);
    });
  });
});
