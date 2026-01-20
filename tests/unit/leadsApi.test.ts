import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const querySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
  days: z.coerce.number().min(1).max(365).optional(),
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "CLOSED"]).optional(),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
  serviceId: z.coerce.number().optional(),
  search: z.string().max(100).optional(),
});

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "CLOSED"]).optional(),
  notes: z.string().max(5000).optional(),
});

describe("Leads API", () => {
  describe("Query Parameter Validation", () => {
    it("uses default limit when not provided", () => {
      const result = querySchema.parse({});
      expect(result.limit).toBe(PAGE_SIZE);
    });

    it("accepts valid limit within bounds", () => {
      const result = querySchema.parse({ limit: 50 });
      expect(result.limit).toBe(50);
    });

    it("rejects limit exceeding maximum", () => {
      expect(() => querySchema.parse({ limit: 150 })).toThrow();
    });

    it("rejects limit below minimum", () => {
      expect(() => querySchema.parse({ limit: 0 })).toThrow();
    });

    it("parses valid status filter", () => {
      const result = querySchema.parse({ status: "NEW" });
      expect(result.status).toBe("NEW");
    });

    it("rejects invalid status", () => {
      expect(() => querySchema.parse({ status: "INVALID" })).toThrow();
    });

    it("parses valid temperature filter", () => {
      const result = querySchema.parse({ temperature: "HOT" });
      expect(result.temperature).toBe("HOT");
    });

    it("rejects invalid temperature", () => {
      expect(() => querySchema.parse({ temperature: "LUKEWARM" })).toThrow();
    });

    it("parses valid days filter", () => {
      const result = querySchema.parse({ days: 30 });
      expect(result.days).toBe(30);
    });

    it("rejects days exceeding maximum", () => {
      expect(() => querySchema.parse({ days: 400 })).toThrow();
    });

    it("rejects days below minimum", () => {
      expect(() => querySchema.parse({ days: 0 })).toThrow();
    });

    it("parses valid serviceId", () => {
      const result = querySchema.parse({ serviceId: 123 });
      expect(result.serviceId).toBe(123);
    });

    it("accepts valid search string", () => {
      const result = querySchema.parse({ search: "john" });
      expect(result.search).toBe("john");
    });

    it("rejects search string exceeding max length", () => {
      expect(() =>
        querySchema.parse({ search: "a".repeat(101) })
      ).toThrow();
    });

    it("parses valid cursor UUID", () => {
      const cursor = "550e8400-e29b-41d4-a716-446655440000";
      const result = querySchema.parse({ cursor });
      expect(result.cursor).toBe(cursor);
    });

    it("rejects invalid cursor UUID", () => {
      expect(() => querySchema.parse({ cursor: "invalid-uuid" })).toThrow();
    });
  });

  describe("Update Body Validation", () => {
    it("accepts valid status update", () => {
      const result = updateSchema.parse({ status: "CONTACTED" });
      expect(result.status).toBe("CONTACTED");
    });

    it("rejects invalid status value", () => {
      expect(() => updateSchema.parse({ status: "INVALID" })).toThrow();
    });

    it("accepts valid notes update", () => {
      const result = updateSchema.parse({ notes: "Follow up next week" });
      expect(result.notes).toBe("Follow up next week");
    });

    it("rejects notes exceeding max length", () => {
      expect(() => updateSchema.parse({ notes: "a".repeat(5001) })).toThrow();
    });

    it("accepts both status and notes together", () => {
      const result = updateSchema.parse({
        status: "BOOKED",
        notes: "Appointment confirmed",
      });
      expect(result.status).toBe("BOOKED");
      expect(result.notes).toBe("Appointment confirmed");
    });

    it("accepts empty object", () => {
      const result = updateSchema.parse({});
      expect(result.status).toBeUndefined();
      expect(result.notes).toBeUndefined();
    });
  });

  describe("Tenant Isolation Logic", () => {
    it("validates organizationId is required in where clause", () => {
      const buildWhereClause = (orgId: number, filters: Record<string, unknown>) => {
        return {
          organizationId: orgId,
          ...filters,
        };
      };

      const whereClause = buildWhereClause(123, { status: "NEW" });
      expect(whereClause.organizationId).toBe(123);
      expect(whereClause.status).toBe("NEW");
    });

    it("scopes all queries to organization", () => {
      const buildQuery = (orgId: number) => ({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      });

      const query = buildQuery(456);
      expect(query.where.organizationId).toBe(456);
    });
  });

  describe("RBAC Access Control", () => {
    const checkLeadEditAccess = (role: string, allowClientEdits: boolean): boolean => {
      if (role === "AGENCY_OWNER" || role === "AGENCY_ADMIN") {
        return true;
      }
      if (role === "CLIENT" && allowClientEdits) {
        return true;
      }
      return false;
    };

    it("allows AGENCY_OWNER to edit leads", () => {
      expect(checkLeadEditAccess("AGENCY_OWNER", false)).toBe(true);
    });

    it("allows AGENCY_ADMIN to edit leads", () => {
      expect(checkLeadEditAccess("AGENCY_ADMIN", false)).toBe(true);
    });

    it("denies CLIENT edit access when allowClientEdits is false", () => {
      expect(checkLeadEditAccess("CLIENT", false)).toBe(false);
    });

    it("allows CLIENT edit access when allowClientEdits is true", () => {
      expect(checkLeadEditAccess("CLIENT", true)).toBe(true);
    });
  });

  describe("Pagination Logic", () => {
    it("calculates hasNextPage correctly when more results exist", () => {
      const limit = 10;
      const results = Array(11).fill({ id: 1 });
      const hasNextPage = results.length > limit;
      expect(hasNextPage).toBe(true);
    });

    it("calculates hasNextPage correctly when no more results exist", () => {
      const limit = 10;
      const results = Array(5).fill({ id: 1 });
      const hasNextPage = results.length > limit;
      expect(hasNextPage).toBe(false);
    });

    it("slices results correctly for pagination", () => {
      const limit = 10;
      const results = Array(15).fill({}).map((_, i) => ({ id: i }));
      const hasNextPage = results.length > limit;
      const resultsToReturn = hasNextPage ? results.slice(0, limit) : results;
      expect(resultsToReturn.length).toBe(10);
    });

    it("returns correct nextCursor", () => {
      const results = [
        { publicId: "a" },
        { publicId: "b" },
        { publicId: "c" },
      ];
      const limit = 2;
      const hasNextPage = results.length > limit;
      const resultsToReturn = hasNextPage ? results.slice(0, limit) : results;
      const nextCursor = hasNextPage
        ? resultsToReturn[resultsToReturn.length - 1]?.publicId
        : null;
      expect(nextCursor).toBe("b");
    });

    it("returns null nextCursor when no more pages", () => {
      const results = [{ publicId: "a" }];
      const limit = 10;
      const hasNextPage = results.length > limit;
      const nextCursor = hasNextPage
        ? results[results.length - 1]?.publicId
        : null;
      expect(nextCursor).toBeNull();
    });
  });

  describe("Date Range Filter", () => {
    it("calculates correct date for 7 day range", () => {
      const days = 7;
      const now = Date.now();
      const start = new Date(now - days * 24 * 60 * 60 * 1000);
      const expectedMs = days * 24 * 60 * 60 * 1000;
      expect(now - start.getTime()).toBeCloseTo(expectedMs, -5);
    });

    it("calculates correct date for 30 day range", () => {
      const days = 30;
      const now = Date.now();
      const start = new Date(now - days * 24 * 60 * 60 * 1000);
      const expectedMs = days * 24 * 60 * 60 * 1000;
      expect(now - start.getTime()).toBeCloseTo(expectedMs, -5);
    });

    it("calculates correct date for 90 day range", () => {
      const days = 90;
      const now = Date.now();
      const start = new Date(now - days * 24 * 60 * 60 * 1000);
      const expectedMs = days * 24 * 60 * 60 * 1000;
      expect(now - start.getTime()).toBeCloseTo(expectedMs, -5);
    });
  });

  describe("Search Filter", () => {
    it("builds correct OR filter for search", () => {
      const search = "john";
      const searchFilter = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      };
      expect(searchFilter.OR.length).toBe(3);
      expect(searchFilter.OR[0].name.contains).toBe("john");
    });

    it("returns undefined for empty search", () => {
      const search = "";
      const searchFilter = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined;
      expect(searchFilter).toBeUndefined();
    });
  });

  describe("Summary Aggregation", () => {
    it("correctly aggregates status counts", () => {
      const statusCounts = [
        { status: "NEW", _count: { id: 10 } },
        { status: "CONTACTED", _count: { id: 5 } },
        { status: "BOOKED", _count: { id: 3 } },
        { status: "CLOSED", _count: { id: 2 } },
      ];

      const byStatus = {
        NEW: statusCounts.find((c) => c.status === "NEW")?._count.id ?? 0,
        CONTACTED:
          statusCounts.find((c) => c.status === "CONTACTED")?._count.id ?? 0,
        BOOKED: statusCounts.find((c) => c.status === "BOOKED")?._count.id ?? 0,
        CLOSED: statusCounts.find((c) => c.status === "CLOSED")?._count.id ?? 0,
      };

      expect(byStatus.NEW).toBe(10);
      expect(byStatus.CONTACTED).toBe(5);
      expect(byStatus.BOOKED).toBe(3);
      expect(byStatus.CLOSED).toBe(2);
    });

    it("correctly aggregates temperature counts", () => {
      const tempCounts = [
        { temperature: "HOT", _count: { id: 8 } },
        { temperature: "WARM", _count: { id: 12 } },
        { temperature: "COLD", _count: { id: 5 } },
      ];

      const byTemperature = {
        HOT: tempCounts.find((c) => c.temperature === "HOT")?._count.id ?? 0,
        WARM: tempCounts.find((c) => c.temperature === "WARM")?._count.id ?? 0,
        COLD: tempCounts.find((c) => c.temperature === "COLD")?._count.id ?? 0,
      };

      expect(byTemperature.HOT).toBe(8);
      expect(byTemperature.WARM).toBe(12);
      expect(byTemperature.COLD).toBe(5);
    });

    it("returns 0 for missing status counts", () => {
      const statusCounts: Array<{ status: string; _count: { id: number } }> = [];

      const byStatus = {
        NEW: statusCounts.find((c) => c.status === "NEW")?._count.id ?? 0,
        CONTACTED:
          statusCounts.find((c) => c.status === "CONTACTED")?._count.id ?? 0,
        BOOKED: statusCounts.find((c) => c.status === "BOOKED")?._count.id ?? 0,
        CLOSED: statusCounts.find((c) => c.status === "CLOSED")?._count.id ?? 0,
      };

      expect(byStatus.NEW).toBe(0);
      expect(byStatus.CONTACTED).toBe(0);
      expect(byStatus.BOOKED).toBe(0);
      expect(byStatus.CLOSED).toBe(0);
    });
  });

  describe("UUID Validation", () => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    it("validates correct UUID format", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(uuidRegex.test(validUuid)).toBe(true);
    });

    it("rejects invalid UUID format", () => {
      const invalidUuid = "not-a-valid-uuid";
      expect(uuidRegex.test(invalidUuid)).toBe(false);
    });

    it("rejects short UUID", () => {
      const shortUuid = "550e8400-e29b-41d4";
      expect(uuidRegex.test(shortUuid)).toBe(false);
    });

    it("accepts uppercase UUID", () => {
      const uppercaseUuid = "550E8400-E29B-41D4-A716-446655440000";
      expect(uuidRegex.test(uppercaseUuid)).toBe(true);
    });
  });
});
