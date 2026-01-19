import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalEnv = { ...process.env };

function createMockRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/test", {
    headers: new Headers(headers),
  });
}

describe("getTestUserId security gates", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("should reject header when NODE_ENV=production even if other gates pass", async () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test_user_123" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should reject header when DEV_BYPASS_AUTH is not true", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "false";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test_user_123" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should reject header when PLAYWRIGHT_TEST is not true", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "false";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test_user_123" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should reject header when PLAYWRIGHT_TEST is undefined", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    delete process.env.PLAYWRIGHT_TEST;

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test_user_123" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should accept header when all gates pass", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test_user_123" });

    expect(getTestUserId(request)).toBe("test_user_123");
  });

  it("should trim whitespace from header value", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "  test_user_123  " });

    expect(getTestUserId(request)).toBe("test_user_123");
  });

  it("should reject empty header value", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should reject whitespace-only header value", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "   " });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should reject header value exceeding 128 characters", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const longId = "a".repeat(129);
    const request = createMockRequest({ "x-test-user-id": longId });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should accept header value exactly at 128 characters", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const exactId = "a".repeat(128);
    const request = createMockRequest({ "x-test-user-id": exactId });

    expect(getTestUserId(request)).toBe(exactId);
  });

  it("should reject header value with invalid characters (spaces)", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test user 123" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should reject header value with invalid characters (special chars)", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "test@user#123" });

    expect(getTestUserId(request)).toBeUndefined();
  });

  it("should accept valid characters: alphanumeric, underscore, dash", async () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_BYPASS_AUTH = "true";
    process.env.PLAYWRIGHT_TEST = "true";

    const { getTestUserId } = await import("@/lib/auth/getOrgContext");
    const request = createMockRequest({ "x-test-user-id": "Test_User-123_ABC" });

    expect(getTestUserId(request)).toBe("Test_User-123_ABC");
  });
});
