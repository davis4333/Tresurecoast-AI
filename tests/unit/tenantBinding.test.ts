import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { enforceTenantBinding, resolveHostPolicy, isHostAllowed } from "../../src/lib/public/hostPolicy";

vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    organization: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "../../src/lib/prisma";

const mockPrisma = prisma as any;

describe("enforceTenantBinding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("allows request when no custom domain is configured (platform mode)", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue(null);

    const req = new Request("https://example.com/api/test", {
      headers: { host: "platform.example.com" },
    });

    const result = await enforceTenantBinding({
      req,
      botOrgId: 1,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("platform");
    }
  });

  it("allows request when custom domain matches bot org", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue({
      id: 5,
      customDomainStatus: "verified",
    });

    const req = new Request("https://custom.example.com/api/test", {
      headers: { host: "custom.example.com" },
    });

    const result = await enforceTenantBinding({
      req,
      botOrgId: 5,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("custom_domain");
      expect(result.orgId).toBe(5);
    }
  });

  it("blocks cross-tenant access when custom domain belongs to different org", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue({
      id: 10,
      customDomainStatus: "verified",
    });

    const req = new Request("https://other-tenant.com/api/test", {
      headers: { host: "other-tenant.com" },
    });

    const result = await enforceTenantBinding({
      req,
      botOrgId: 5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe("cross_tenant_host");
      expect(result.message).toBe("Host is bound to a different organization");
    }
  });

  it("blocks request when custom domain is not verified", async () => {
    mockPrisma.organization.findFirst.mockResolvedValue({
      id: 5,
      customDomainStatus: "pending",
    });

    const req = new Request("https://unverified.example.com/api/test", {
      headers: { host: "unverified.example.com" },
    });

    const result = await enforceTenantBinding({
      req,
      botOrgId: 5,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe("custom_domain_not_verified");
    }
  });

  it("returns error when host header is missing", async () => {
    const req = new Request("https://example.com/api/test");

    const result = await enforceTenantBinding({
      req,
      botOrgId: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toBe("missing_host");
    }
  });
});

describe("isHostAllowed for tenant security", () => {
  it("rejects when origin not in bot allowlist", () => {
    const botAllowlist = ["trusted-client.com", "another-client.org"];

    expect(isHostAllowed(botAllowlist, "https://malicious-site.com", null)).toBe(false);
    expect(isHostAllowed(botAllowlist, "https://attacker.io", null)).toBe(false);
  });

  it("accepts when origin is in bot allowlist", () => {
    const botAllowlist = ["trusted-client.com"];

    expect(isHostAllowed(botAllowlist, "https://trusted-client.com", null)).toBe(true);
    expect(isHostAllowed(botAllowlist, "https://sub.trusted-client.com", null)).toBe(true);
  });

  it("allows all origins when allowlist is empty (bot has no restrictions)", () => {
    expect(isHostAllowed([], "https://any-site.com", null)).toBe(true);
    expect(isHostAllowed(null, "https://any-site.com", null)).toBe(true);
  });

  it("rejects when no origin or host can be determined", () => {
    const botAllowlist = ["trusted-client.com"];

    expect(isHostAllowed(botAllowlist, null, null)).toBe(false);
  });
});
