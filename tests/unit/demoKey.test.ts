import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDemoBotKeyFromEnv, isProduction } from "../../src/lib/public/demoKey";

describe("getDemoBotKeyFromEnv", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when env var is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", "");
    expect(getDemoBotKeyFromEnv()).toBeNull();
  });

  it("returns null when env var is empty string", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", "");
    expect(getDemoBotKeyFromEnv()).toBeNull();
  });

  it("returns null for invalid UUID format", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", "not-a-uuid");
    expect(getDemoBotKeyFromEnv()).toBeNull();
  });

  it("returns null for partial UUID", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", "12345678-1234");
    expect(getDemoBotKeyFromEnv()).toBeNull();
  });

  it("returns valid UUID when correctly formatted", () => {
    const validUuid = "12345678-1234-5678-9abc-def012345678";
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", validUuid);
    expect(getDemoBotKeyFromEnv()).toBe(validUuid);
  });

  it("returns valid UUID with uppercase letters", () => {
    const validUuid = "12345678-ABCD-5678-9ABC-DEF012345678";
    vi.stubEnv("NEXT_PUBLIC_DEMO_BOT_KEY", validUuid);
    expect(getDemoBotKeyFromEnv()).toBe(validUuid);
  });
});

describe("isProduction", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isProduction()).toBe(true);
  });

  it("returns false when NODE_ENV is development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isProduction()).toBe(false);
  });

  it("returns false when NODE_ENV is test", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(isProduction()).toBe(false);
  });
});
