import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: { findUnique: vi.fn(), create: vi.fn() },
    organizationMember: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

const mockClerkAuth = vi.fn();
vi.mock("@clerk/nextjs/server", () => ({ auth: mockClerkAuth }));

import { getOrgContext, isAdmin, isOwner } from "./getOrgContext";
import { prisma } from "@/lib/prisma";

describe("getOrgContext", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: "production", DEV_BYPASS_AUTH: "false" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 401 when no userId", async () => {
    mockClerkAuth.mockResolvedValue({ userId: null, orgId: null });
    const result = await getOrgContext();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  it("returns 403 when no orgId", async () => {
    mockClerkAuth.mockResolvedValue({ userId: "user123", orgId: null });
    const result = await getOrgContext();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_org_context");
  });

  it("returns 404 when org not found", async () => {
    mockClerkAuth.mockResolvedValue({ userId: "user123", orgId: "org_456" });
    vi.mocked(prisma.organization.findUnique).mockResolvedValue(null);
    const result = await getOrgContext();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("org_not_found");
  });

  it("returns 403 when no membership", async () => {
    mockClerkAuth.mockResolvedValue({ userId: "user123", orgId: "org_456" });
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 1, name: "Org", clerkOrganizationId: "org_456" } as never);
    vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue(null);
    const result = await getOrgContext();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("no_membership");
  });

  it("returns context when valid", async () => {
    mockClerkAuth.mockResolvedValue({ userId: "user123", orgId: "org_456" });
    vi.mocked(prisma.organization.findUnique).mockResolvedValue({ id: 1, name: "Org", clerkOrganizationId: "org_456" } as never);
    vi.mocked(prisma.organizationMember.findUnique).mockResolvedValue({ role: "AGENCY_OWNER" } as never);
    const result = await getOrgContext();
    expect(result.ok).toBe(true);
  });

  it("role helpers", () => {
    expect(isAdmin("AGENCY_OWNER")).toBe(true);
    expect(isAdmin("AGENCY_ADMIN")).toBe(true);
    expect(isAdmin("CLIENT")).toBe(false);
    expect(isOwner("AGENCY_OWNER")).toBe(true);
    expect(isOwner("AGENCY_ADMIN")).toBe(false);
  });
});
