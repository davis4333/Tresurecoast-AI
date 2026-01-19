import { describe, it, expect, vi, afterEach } from "vitest";
import { getAuthMode, isDevBypassEnabled, isProductionMode, shouldUseClerk, hasValidClerkKeys } from "../../src/lib/auth/authMode";

describe("Production Auth Behavior", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("DEV_BYPASS_AUTH ignored in production", () => {
    it("returns production mode even when DEV_BYPASS_AUTH=true", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEV_BYPASS_AUTH", "true");

      expect(getAuthMode()).toBe("production");
      expect(isDevBypassEnabled()).toBe(false);
      expect(isProductionMode()).toBe(true);
    });

    it("returns production mode without DEV_BYPASS_AUTH", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEV_BYPASS_AUTH", "");

      expect(getAuthMode()).toBe("production");
      expect(isProductionMode()).toBe(true);
    });
  });

  describe("shouldUseClerk in production", () => {
    it("uses Clerk when publishable key is present in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DEV_BYPASS_AUTH", "true");
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_1234");

      expect(shouldUseClerk()).toBe(true);
    });

    it("does not use Clerk when publishable key is missing", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");

      expect(shouldUseClerk()).toBe(false);
    });

    it("does not use Clerk with invalid key format", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "invalid_key");

      expect(shouldUseClerk()).toBe(false);
    });
  });

  describe("hasValidClerkKeys", () => {
    it("returns true when both keys are valid", () => {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_live_abc123");
      vi.stubEnv("CLERK_SECRET_KEY", "sk_live_xyz789");

      expect(hasValidClerkKeys()).toBe(true);
    });

    it("returns false when publishable key is missing", () => {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
      vi.stubEnv("CLERK_SECRET_KEY", "sk_live_xyz789");

      expect(hasValidClerkKeys()).toBe(false);
    });

    it("returns false when secret key is missing", () => {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_live_abc123");
      vi.stubEnv("CLERK_SECRET_KEY", "");

      expect(hasValidClerkKeys()).toBe(false);
    });

    it("returns false when keys have wrong prefix", () => {
      vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "wrong_prefix");
      vi.stubEnv("CLERK_SECRET_KEY", "also_wrong");

      expect(hasValidClerkKeys()).toBe(false);
    });
  });

  describe("dev_bypass only works in development", () => {
    it("enables dev_bypass in development when env is set", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEV_BYPASS_AUTH", "true");

      expect(getAuthMode()).toBe("dev_bypass");
      expect(isDevBypassEnabled()).toBe(true);
    });

    it("uses normal mode in development without DEV_BYPASS_AUTH", () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DEV_BYPASS_AUTH", "");

      expect(getAuthMode()).toBe("normal");
      expect(isDevBypassEnabled()).toBe(false);
    });

    it("uses normal mode in test environment", () => {
      vi.stubEnv("NODE_ENV", "test");
      vi.stubEnv("DEV_BYPASS_AUTH", "");

      expect(getAuthMode()).toBe("normal");
    });
  });
});
