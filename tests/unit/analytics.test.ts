import { describe, it, expect } from "vitest";

describe("Analytics API", () => {
  describe("Date Range Parsing", () => {
    function parseDateRange(daysParam: string | null): { start: Date; end: Date; days: number } {
      const MAX_DAYS = 365;
      const DEFAULT_DAYS = 30;
      const days = daysParam
        ? Math.min(Math.max(parseInt(daysParam, 10) || DEFAULT_DAYS, 1), MAX_DAYS)
        : DEFAULT_DAYS;

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const start = new Date(end);
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);

      return { start, end, days };
    }

    it("defaults to 30 days when no param", () => {
      const result = parseDateRange(null);
      expect(result.days).toBe(30);
    });

    it("parses valid days param", () => {
      const result = parseDateRange("7");
      expect(result.days).toBe(7);
    });

    it("defaults to 30 for zero value", () => {
      const result = parseDateRange("0");
      expect(result.days).toBe(30);
    });

    it("clamps to maximum 365 days", () => {
      const result = parseDateRange("500");
      expect(result.days).toBe(365);
    });

    it("defaults to 30 for invalid param", () => {
      const result = parseDateRange("invalid");
      expect(result.days).toBe(30);
    });

    it("returns correct date range span", () => {
      const result = parseDateRange("7");
      const diffMs = result.end.getTime() - result.start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(7);
      expect(diffDays).toBeLessThanOrEqual(8);
    });
  });

  describe("Funnel Aggregation Logic", () => {
    type FunnelCount = { type: string; _count: { conversationId: number } };

    function buildFunnel(counts: FunnelCount[]) {
      return {
        serviceSelected: counts.find((c) => c.type === "BOOKING_SERVICE_SELECTED")?._count?.conversationId || 0,
        leadCreated: counts.find((c) => c.type === "BOOKING_LEAD_CREATED")?._count?.conversationId || 0,
        linkShown: counts.find((c) => c.type === "BOOKING_LINK_SHOWN")?._count?.conversationId || 0,
        linkClicked: counts.find((c) => c.type === "BOOKING_LINK_CLICKED")?._count?.conversationId || 0,
      };
    }

    it("returns zeros for empty counts", () => {
      const funnel = buildFunnel([]);
      expect(funnel.serviceSelected).toBe(0);
      expect(funnel.leadCreated).toBe(0);
      expect(funnel.linkShown).toBe(0);
      expect(funnel.linkClicked).toBe(0);
    });

    it("correctly maps funnel types", () => {
      const counts: FunnelCount[] = [
        { type: "BOOKING_SERVICE_SELECTED", _count: { conversationId: 10 } },
        { type: "BOOKING_LEAD_CREATED", _count: { conversationId: 8 } },
        { type: "BOOKING_LINK_SHOWN", _count: { conversationId: 7 } },
        { type: "BOOKING_LINK_CLICKED", _count: { conversationId: 5 } },
      ];
      const funnel = buildFunnel(counts);
      expect(funnel.serviceSelected).toBe(10);
      expect(funnel.leadCreated).toBe(8);
      expect(funnel.linkShown).toBe(7);
      expect(funnel.linkClicked).toBe(5);
    });

    it("handles partial funnel data", () => {
      const counts: FunnelCount[] = [
        { type: "BOOKING_SERVICE_SELECTED", _count: { conversationId: 5 } },
      ];
      const funnel = buildFunnel(counts);
      expect(funnel.serviceSelected).toBe(5);
      expect(funnel.leadCreated).toBe(0);
      expect(funnel.linkShown).toBe(0);
      expect(funnel.linkClicked).toBe(0);
    });
  });

  describe("Date Bucketing", () => {
    function formatDateForBucket(date: Date): string {
      return date.toISOString().split("T")[0] ?? "";
    }

    function bucketByDay(items: { createdAt: Date }[]): Array<{ date: string; count: number }> {
      const map: Record<string, number> = {};
      for (const item of items) {
        const date = formatDateForBucket(item.createdAt);
        map[date] = (map[date] || 0) + 1;
      }
      return Object.entries(map)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    it("returns empty array for no items", () => {
      expect(bucketByDay([])).toEqual([]);
    });

    it("groups items by date", () => {
      const items = [
        { createdAt: new Date("2026-01-15T10:00:00Z") },
        { createdAt: new Date("2026-01-15T14:00:00Z") },
        { createdAt: new Date("2026-01-16T08:00:00Z") },
      ];
      const result = bucketByDay(items);
      expect(result).toEqual([
        { date: "2026-01-15", count: 2 },
        { date: "2026-01-16", count: 1 },
      ]);
    });

    it("sorts results by date", () => {
      const items = [
        { createdAt: new Date("2026-01-18T10:00:00Z") },
        { createdAt: new Date("2026-01-15T10:00:00Z") },
        { createdAt: new Date("2026-01-16T10:00:00Z") },
      ];
      const result = bucketByDay(items);
      expect(result[0].date).toBe("2026-01-15");
      expect(result[1].date).toBe("2026-01-16");
      expect(result[2].date).toBe("2026-01-18");
    });
  });

  describe("Tenant Isolation", () => {
    it("validates organizationId is required for queries", () => {
      const buildQuery = (orgId: number | undefined) => {
        if (!orgId) throw new Error("organizationId required");
        return { organizationId: orgId };
      };

      expect(() => buildQuery(undefined)).toThrow("organizationId required");
      expect(() => buildQuery(1)).not.toThrow();
    });
  });

  describe("RBAC Access Control", () => {
    type Role = "AGENCY_OWNER" | "AGENCY_ADMIN" | "CLIENT";

    function canAccessAnalytics(role: Role, allowClientEdits: boolean): boolean {
      if (role === "AGENCY_OWNER" || role === "AGENCY_ADMIN") {
        return true;
      }
      if (role === "CLIENT") {
        return allowClientEdits;
      }
      return false;
    }

    it("allows AGENCY_OWNER access", () => {
      expect(canAccessAnalytics("AGENCY_OWNER", false)).toBe(true);
      expect(canAccessAnalytics("AGENCY_OWNER", true)).toBe(true);
    });

    it("allows AGENCY_ADMIN access", () => {
      expect(canAccessAnalytics("AGENCY_ADMIN", false)).toBe(true);
      expect(canAccessAnalytics("AGENCY_ADMIN", true)).toBe(true);
    });

    it("denies CLIENT access when allowClientEdits is false", () => {
      expect(canAccessAnalytics("CLIENT", false)).toBe(false);
    });

    it("allows CLIENT access when allowClientEdits is true", () => {
      expect(canAccessAnalytics("CLIENT", true)).toBe(true);
    });
  });

  describe("Conversion Rate Calculation", () => {
    function calculateConversionRate(leads: number, clicks: number): string {
      if (leads === 0) return "0";
      return ((clicks / leads) * 100).toFixed(1);
    }

    it("returns 0 when no leads", () => {
      expect(calculateConversionRate(0, 0)).toBe("0");
      expect(calculateConversionRate(0, 10)).toBe("0");
    });

    it("calculates correct percentage", () => {
      expect(calculateConversionRate(100, 50)).toBe("50.0");
      expect(calculateConversionRate(10, 3)).toBe("30.0");
      expect(calculateConversionRate(7, 2)).toBe("28.6");
    });
  });
});
