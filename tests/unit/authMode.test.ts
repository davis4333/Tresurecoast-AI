import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("authMode", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getAuthMode", () => {
    it("returns 'production' when NODE_ENV=production, ignoring DEV_BYPASS_AUTH", async () => {
      process.env.NODE_ENV = "production";
      process.env.DEV_BYPASS_AUTH = "true";

      const { getAuthMode } = await import("@/lib/auth/authMode");
      expect(getAuthMode()).toBe("production");
    });

    it("returns 'dev_bypass' when NODE_ENV=development and DEV_BYPASS_AUTH=true", async () => {
      process.env.NODE_ENV = "development";
      process.env.DEV_BYPASS_AUTH = "true";

      const { getAuthMode } = await import("@/lib/auth/authMode");
      expect(getAuthMode()).toBe("dev_bypass");
    });

    it("returns 'normal' when NODE_ENV=development and DEV_BYPASS_AUTH is not set", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DEV_BYPASS_AUTH;

      const { getAuthMode } = await import("@/lib/auth/authMode");
      expect(getAuthMode()).toBe("normal");
    });

    it("returns 'normal' when NODE_ENV=development and DEV_BYPASS_AUTH=false", async () => {
      process.env.NODE_ENV = "development";
      process.env.DEV_BYPASS_AUTH = "false";

      const { getAuthMode } = await import("@/lib/auth/authMode");
      expect(getAuthMode()).toBe("normal");
    });

    it("returns 'normal' when NODE_ENV=test and DEV_BYPASS_AUTH is not set", async () => {
      process.env.NODE_ENV = "test";
      delete process.env.DEV_BYPASS_AUTH;

      const { getAuthMode } = await import("@/lib/auth/authMode");
      expect(getAuthMode()).toBe("normal");
    });
  });

  describe("isDevBypassEnabled", () => {
    it("returns true when in dev_bypass mode", async () => {
      process.env.NODE_ENV = "development";
      process.env.DEV_BYPASS_AUTH = "true";

      const { isDevBypassEnabled } = await import("@/lib/auth/authMode");
      expect(isDevBypassEnabled()).toBe(true);
    });

    it("returns false in production even if DEV_BYPASS_AUTH=true", async () => {
      process.env.NODE_ENV = "production";
      process.env.DEV_BYPASS_AUTH = "true";

      const { isDevBypassEnabled } = await import("@/lib/auth/authMode");
      expect(isDevBypassEnabled()).toBe(false);
    });
  });

  describe("isProductionMode", () => {
    it("returns true when NODE_ENV=production", async () => {
      process.env.NODE_ENV = "production";

      const { isProductionMode } = await import("@/lib/auth/authMode");
      expect(isProductionMode()).toBe(true);
    });

    it("returns false when NODE_ENV=development", async () => {
      process.env.NODE_ENV = "development";

      const { isProductionMode } = await import("@/lib/auth/authMode");
      expect(isProductionMode()).toBe(false);
    });
  });

  describe("shouldUseClerk", () => {
    it("returns false in dev_bypass mode regardless of Clerk keys", async () => {
      process.env.NODE_ENV = "development";
      process.env.DEV_BYPASS_AUTH = "true";
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_valid";

      const { shouldUseClerk } = await import("@/lib/auth/authMode");
      expect(shouldUseClerk()).toBe(false);
    });

    it("returns true when Clerk key is valid and not in bypass mode", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DEV_BYPASS_AUTH;
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_valid";

      const { shouldUseClerk } = await import("@/lib/auth/authMode");
      expect(shouldUseClerk()).toBe(true);
    });

    it("returns false when Clerk key is missing and not in bypass mode", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DEV_BYPASS_AUTH;
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

      const { shouldUseClerk } = await import("@/lib/auth/authMode");
      expect(shouldUseClerk()).toBe(false);
    });

    it("returns false when Clerk key is invalid format", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.DEV_BYPASS_AUTH;
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "invalid_key";

      const { shouldUseClerk } = await import("@/lib/auth/authMode");
      expect(shouldUseClerk()).toBe(false);
    });
  });

  describe("hasValidClerkKeys", () => {
    it("returns true when both keys are valid", async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_valid";
      process.env.CLERK_SECRET_KEY = "sk_test_valid";

      const { hasValidClerkKeys } = await import("@/lib/auth/authMode");
      expect(hasValidClerkKeys()).toBe(true);
    });

    it("returns false when publishable key is missing", async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      process.env.CLERK_SECRET_KEY = "sk_test_valid";

      const { hasValidClerkKeys } = await import("@/lib/auth/authMode");
      expect(hasValidClerkKeys()).toBe(false);
    });

    it("returns false when secret key is missing", async () => {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_valid";
      delete process.env.CLERK_SECRET_KEY;

      const { hasValidClerkKeys } = await import("@/lib/auth/authMode");
      expect(hasValidClerkKeys()).toBe(false);
    });

    it("returns false when both keys are missing", async () => {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      delete process.env.CLERK_SECRET_KEY;

      const { hasValidClerkKeys } = await import("@/lib/auth/authMode");
      expect(hasValidClerkKeys()).toBe(false);
    });
  });
});
