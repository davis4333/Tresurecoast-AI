import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/org/settings/hours/route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findUnique: vi.fn(),
    },
    organizationHours: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/getOrgContext", () => ({
  getOrgContext: vi.fn(),
  isAdmin: vi.fn((role: string) => role === "AGENCY_OWNER" || role === "AGENCY_ADMIN"),
  getTestUserId: vi.fn(() => "test_user_123"),
}));

import { getOrgContext } from "@/lib/auth/getOrgContext";

const mockGetOrgContext = getOrgContext as ReturnType<typeof vi.fn>;
const mockOrgFindUnique = prisma.organization.findUnique as ReturnType<typeof vi.fn>;
const mockHoursFindMany = prisma.organizationHours.findMany as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

function createRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/org/settings/hours", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

const validWeek = [
  { dayOfWeek: 0, isClosed: true, openTime: null, closeTime: null },
  { dayOfWeek: 1, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 2, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 3, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 4, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 5, isClosed: false, openTime: "09:00", closeTime: "17:00" },
  { dayOfWeek: 6, isClosed: true, openTime: null, closeTime: null },
];

describe("GET /api/org/settings/hours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: false,
      error: "unauthorized",
      message: "Not authenticated",
      status: 401,
    });

    const res = await GET(createRequest("GET"));
    expect(res.status).toBe(401);
  });

  it("returns canonical 7-day response even when DB is empty", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockHoursFindMany.mockResolvedValueOnce([]);

    const res = await GET(createRequest("GET"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.hours).toHaveLength(7);
    expect(data.hours[0].dayOfWeek).toBe(0);
    expect(data.hours[0].dayName).toBe("Sunday");
    expect(data.hours[6].dayOfWeek).toBe(6);
    expect(data.hours[6].dayName).toBe("Saturday");
  });

  it("returns existing hours from DB", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockHoursFindMany.mockResolvedValueOnce([
      { dayOfWeek: 1, isClosed: false, openTime: "10:00", closeTime: "18:00" },
    ]);

    const res = await GET(createRequest("GET"));
    const data = await res.json();

    expect(data.hours[1].openTime).toBe("10:00");
    expect(data.hours[1].closeTime).toBe("18:00");
    expect(data.hours[0].isClosed).toBe(true);
  });

  it("includes correct permissions for OWNER", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockHoursFindMany.mockResolvedValueOnce([]);

    const res = await GET(createRequest("GET"));
    const data = await res.json();

    expect(data.permissions.canEdit).toBe(true);
    expect(data.permissions.role).toBe("AGENCY_OWNER");
  });

  it("CLIENT can read but canEdit=false when allowClientEdits=false", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "CLIENT",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockHoursFindMany.mockResolvedValueOnce([]);

    const res = await GET(createRequest("GET"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.permissions.canEdit).toBe(false);
    expect(data.permissions.allowClientEdits).toBe(false);
  });

  it("CLIENT canEdit=true when allowClientEdits=true", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "CLIENT",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: true });
    mockHoursFindMany.mockResolvedValueOnce([]);

    const res = await GET(createRequest("GET"));
    const data = await res.json();

    expect(data.permissions.canEdit).toBe(true);
    expect(data.permissions.allowClientEdits).toBe(true);
  });
});

describe("PUT /api/org/settings/hours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: false,
      error: "unauthorized",
      message: "Not authenticated",
      status: 401,
    });

    const res = await PUT(createRequest("PUT", { hours: validWeek }));
    expect(res.status).toBe(401);
  });

  it("OWNER can update hours", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        organizationHours: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
      });
    });
    mockHoursFindMany.mockResolvedValueOnce(validWeek);

    const res = await PUT(createRequest("PUT", { hours: validWeek }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.hours).toHaveLength(7);
  });

  it("ADMIN can update hours", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_ADMIN",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        organizationHours: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
      });
    });
    mockHoursFindMany.mockResolvedValueOnce(validWeek);

    const res = await PUT(createRequest("PUT", { hours: validWeek }));
    expect(res.status).toBe(200);
  });

  it("CLIENT blocked when allowClientEdits=false", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "CLIENT",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });

    const res = await PUT(createRequest("PUT", { hours: validWeek }));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("forbidden");
  });

  it("CLIENT can update when allowClientEdits=true", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "CLIENT",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: true });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        organizationHours: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
      });
    });
    mockHoursFindMany.mockResolvedValueOnce(validWeek);

    const res = await PUT(createRequest("PUT", { hours: validWeek }));
    expect(res.status).toBe(200);
  });

  it("rejects invalid payload (missing hours array)", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });

    const res = await PUT(createRequest("PUT", { foo: "bar" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("rejects less than 7 days", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });

    const res = await PUT(createRequest("PUT", { hours: validWeek.slice(0, 5) }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("rejects invalid time format", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });

    const invalidWeek = validWeek.map((d, i) =>
      i === 1 ? { ...d, openTime: "9:00" } : d
    );
    const res = await PUT(createRequest("PUT", { hours: invalidWeek }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });

  it("rejects open >= close", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Test Org" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });

    const invalidWeek = validWeek.map((d, i) =>
      i === 1 ? { ...d, openTime: "18:00", closeTime: "09:00" } : d
    );
    const res = await PUT(createRequest("PUT", { hours: invalidWeek }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("validation_error");
  });
});

describe("Tenant Isolation", () => {
  it("org A writes do not affect org B reads", async () => {
    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 1, name: "Org A" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      await fn({
        organizationHours: {
          deleteMany: vi.fn(),
          createMany: vi.fn(),
        },
      });
    });
    mockHoursFindMany.mockResolvedValueOnce(validWeek);

    const resA = await PUT(createRequest("PUT", { hours: validWeek }));
    expect(resA.status).toBe(200);

    mockGetOrgContext.mockResolvedValueOnce({
      ok: true,
      org: { id: 2, name: "Org B" },
      role: "AGENCY_OWNER",
    });
    mockOrgFindUnique.mockResolvedValueOnce({ allowClientEdits: false });
    mockHoursFindMany.mockResolvedValueOnce([]);

    const resB = await GET(createRequest("GET"));
    const dataB = await resB.json();

    expect(dataB.hours).toHaveLength(7);
    expect(dataB.hours[1].isClosed).toBe(true);
    expect(mockHoursFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { organizationId: 2 },
      })
    );
  });
});
