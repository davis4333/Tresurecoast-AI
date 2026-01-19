import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRequestHost,
  getOriginHost,
  resolveHostPolicy,
  isHostAllowed,
  enforceTenantBinding,
} from "@/lib/public/hostPolicy";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindFirst = prisma.organization.findFirst as ReturnType<typeof vi.fn>;

function createMockRequest(headers: Record<string, string>): Request {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  } as unknown as Request;
}

describe("getRequestHost", () => {
  it("should return null when no host header", () => {
    const req = createMockRequest({});
    expect(getRequestHost(req)).toBeNull();
  });

  it("should prefer x-forwarded-host over host", () => {
    const req = createMockRequest({
      "x-forwarded-host": "forwarded.example.com",
      host: "direct.example.com",
    });
    expect(getRequestHost(req)).toBe("forwarded.example.com");
  });

  it("should use host when x-forwarded-host is missing", () => {
    const req = createMockRequest({
      host: "direct.example.com",
    });
    expect(getRequestHost(req)).toBe("direct.example.com");
  });

  it("should strip port and lowercase", () => {
    const req = createMockRequest({
      host: "EXAMPLE.COM:8080",
    });
    expect(getRequestHost(req)).toBe("example.com");
  });

  it("should trim whitespace", () => {
    const req = createMockRequest({
      host: "  example.com  ",
    });
    expect(getRequestHost(req)).toBe("example.com");
  });
});

describe("getOriginHost", () => {
  it("should return null when no origin header", () => {
    const req = createMockRequest({});
    expect(getOriginHost(req)).toBeNull();
  });

  it("should return hostname from valid origin", () => {
    const req = createMockRequest({
      origin: "https://example.com:3000/path",
    });
    expect(getOriginHost(req)).toBe("example.com");
  });

  it("should return null for invalid origin", () => {
    const req = createMockRequest({
      origin: "not-a-valid-url",
    });
    expect(getOriginHost(req)).toBeNull();
  });

  it("should lowercase the hostname", () => {
    const req = createMockRequest({
      origin: "https://EXAMPLE.COM",
    });
    expect(getOriginHost(req)).toBe("example.com");
  });
});

describe("isHostAllowed", () => {
  it("should return true for empty allowlist", () => {
    expect(isHostAllowed([], "https://example.com", "example.com")).toBe(true);
    expect(isHostAllowed(null, "https://example.com", "example.com")).toBe(true);
    expect(isHostAllowed(undefined, "https://example.com", "example.com")).toBe(true);
  });

  it("should return false when no hostname can be determined", () => {
    expect(isHostAllowed(["allowed.com"], null, null)).toBe(false);
  });

  it("should allow exact match from origin", () => {
    expect(isHostAllowed(["example.com"], "https://example.com", null)).toBe(true);
  });

  it("should allow exact match from host", () => {
    expect(isHostAllowed(["example.com"], null, "example.com")).toBe(true);
  });

  it("should allow subdomain match", () => {
    expect(isHostAllowed(["example.com"], "https://sub.example.com", null)).toBe(true);
  });

  it("should reject non-matching domain", () => {
    expect(isHostAllowed(["allowed.com"], "https://notallowed.com", null)).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(isHostAllowed(["EXAMPLE.COM"], "https://example.com", null)).toBe(true);
  });

  it("should prefer origin over host for hostname extraction", () => {
    expect(isHostAllowed(["origin.com"], "https://origin.com", "host.com")).toBe(true);
  });
});

describe("resolveHostPolicy", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it("should return missing_host (400) when no host header", async () => {
    const req = createMockRequest({});
    const result = await resolveHostPolicy(req);
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "missing_host",
      message: "Host header is required",
    });
  });

  it("should return ok platform when host not found in DB", async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = createMockRequest({ host: "platform.replit.app" });
    const result = await resolveHostPolicy(req);
    expect(result).toEqual({
      ok: true,
      mode: "platform",
      host: "platform.replit.app",
    });
  });

  it("should return 403 custom_domain_not_verified when status is pending", async () => {
    mockFindFirst.mockResolvedValue({ id: 1, customDomainStatus: "pending" });
    const req = createMockRequest({ host: "custom.example.com" });
    const result = await resolveHostPolicy(req);
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "custom_domain_not_verified",
      message: "Custom domain is not verified yet",
    });
  });

  it("should return 403 custom_domain_not_verified when status is failed", async () => {
    mockFindFirst.mockResolvedValue({ id: 2, customDomainStatus: "failed" });
    const req = createMockRequest({ host: "custom.example.com" });
    const result = await resolveHostPolicy(req);
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "custom_domain_not_verified",
      message: "Custom domain is not verified yet",
    });
  });

  it("should return 403 custom_domain_not_verified when status is none", async () => {
    mockFindFirst.mockResolvedValue({ id: 3, customDomainStatus: "none" });
    const req = createMockRequest({ host: "custom.example.com" });
    const result = await resolveHostPolicy(req);
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "custom_domain_not_verified",
      message: "Custom domain is not verified yet",
    });
  });

  it("should return ok custom_domain with orgId when verified", async () => {
    mockFindFirst.mockResolvedValue({ id: 42, customDomainStatus: "verified" });
    const req = createMockRequest({ host: "verified.example.com" });
    const result = await resolveHostPolicy(req);
    expect(result).toEqual({
      ok: true,
      mode: "custom_domain",
      host: "verified.example.com",
      orgId: 42,
    });
  });
});

describe("enforceTenantBinding", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it("should pass through policy error", async () => {
    const req = createMockRequest({});
    const result = await enforceTenantBinding({ req, botOrgId: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("missing_host");
    }
  });

  it("should return ok for platform mode (no tenant binding)", async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = createMockRequest({ host: "platform.replit.app" });
    const result = await enforceTenantBinding({ req, botOrgId: 1 });
    expect(result).toEqual({
      ok: true,
      mode: "platform",
      host: "platform.replit.app",
    });
  });

  it("should return 403 cross_tenant_host when org mismatch", async () => {
    mockFindFirst.mockResolvedValue({ id: 99, customDomainStatus: "verified" });
    const req = createMockRequest({ host: "verified.example.com" });
    const result = await enforceTenantBinding({ req, botOrgId: 1 });
    expect(result).toEqual({
      ok: false,
      status: 403,
      error: "cross_tenant_host",
      message: "Host is bound to a different organization",
    });
  });

  it("should return ok when custom_domain org matches", async () => {
    mockFindFirst.mockResolvedValue({ id: 42, customDomainStatus: "verified" });
    const req = createMockRequest({ host: "verified.example.com" });
    const result = await enforceTenantBinding({ req, botOrgId: 42 });
    expect(result).toEqual({
      ok: true,
      mode: "custom_domain",
      host: "verified.example.com",
      orgId: 42,
    });
  });
});
