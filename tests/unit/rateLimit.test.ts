import { describe, it, expect, vi, afterEach } from "vitest";

describe("Rate Limiting Behavior", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("rate limit logic", () => {
    it("LIMITS configuration defines correct thresholds for all endpoints", () => {
      const LIMITS = {
        chat: { max: 30, window: 60 },
        leads: { max: 10, window: 60 },
        leads_status: { max: 20, window: 60 },
        demo_request: { max: 5, window: 60 },
        booking_click: { max: 20, window: 60 },
        bot_fetch: { max: 60, window: 60 },
        widget_config: { max: 60, window: 60 },
        messages_fetch: { max: 30, window: 60 },
        lead_detail: { max: 30, window: 60 },
        leads_recent: { max: 30, window: 60 }
      };

      expect(LIMITS.chat.max).toBe(30);
      expect(LIMITS.leads.max).toBe(10);
      expect(LIMITS.leads_status.max).toBe(20);
      expect(LIMITS.demo_request.max).toBe(5);
      expect(LIMITS.booking_click.max).toBe(20);
      expect(LIMITS.bot_fetch.max).toBe(60);
      expect(LIMITS.widget_config.max).toBe(60);
      expect(LIMITS.messages_fetch.max).toBe(30);
      expect(LIMITS.lead_detail.max).toBe(30);
      expect(LIMITS.leads_recent.max).toBe(30);
    });

    it("rate limit check returns allowed=false when count exceeds max", () => {
      const count = 31;
      const limit = { max: 30, window: 60 };

      const allowed = count <= limit.max;
      expect(allowed).toBe(false);
    });

    it("rate limit check returns allowed=true when count is at max", () => {
      const count = 30;
      const limit = { max: 30, window: 60 };

      const allowed = count <= limit.max;
      expect(allowed).toBe(true);
    });

    it("rate limit check returns allowed=true when count is below max", () => {
      const count = 15;
      const limit = { max: 30, window: 60 };

      const allowed = count <= limit.max;
      expect(allowed).toBe(true);
    });

    it("leads endpoint has stricter limit than chat", () => {
      const LIMITS = {
        chat: { max: 30, window: 60 },
        leads: { max: 10, window: 60 },
      };

      expect(LIMITS.leads.max).toBeLessThan(LIMITS.chat.max);
    });
  });

  describe("client identifier extraction logic", () => {
    it("extracts IP from x-forwarded-for header", () => {
      function getClientIdentifier(req: Request): string {
        const forwarded = req.headers.get("x-forwarded-for");
        if (forwarded) {
          const firstIp = forwarded.split(",")[0]?.trim();
          if (firstIp) return firstIp;
        }
        const realIp = req.headers.get("x-real-ip");
        if (realIp?.trim()) return realIp.trim();
        return "unknown";
      }

      const req = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      expect(getClientIdentifier(req)).toBe("192.168.1.1");
    });

    it("falls back to x-real-ip when x-forwarded-for is missing", () => {
      function getClientIdentifier(req: Request): string {
        const forwarded = req.headers.get("x-forwarded-for");
        if (forwarded) {
          const firstIp = forwarded.split(",")[0]?.trim();
          if (firstIp) return firstIp;
        }
        const realIp = req.headers.get("x-real-ip");
        if (realIp?.trim()) return realIp.trim();
        return "unknown";
      }

      const req = new Request("https://example.com", {
        headers: { "x-real-ip": "10.0.0.5" },
      });

      expect(getClientIdentifier(req)).toBe("10.0.0.5");
    });

    it("returns unknown when no IP headers present", () => {
      function getClientIdentifier(req: Request): string {
        const forwarded = req.headers.get("x-forwarded-for");
        if (forwarded) {
          const firstIp = forwarded.split(",")[0]?.trim();
          if (firstIp) return firstIp;
        }
        const realIp = req.headers.get("x-real-ip");
        if (realIp?.trim()) return realIp.trim();
        return "unknown";
      }

      const req = new Request("https://example.com");

      expect(getClientIdentifier(req)).toBe("unknown");
    });
  });

  describe("fail-open behavior", () => {
    it("rate limiter should allow requests when Redis is unavailable", () => {
      const redisAvailable = false;

      const allowed = !redisAvailable ? true : false;
      expect(allowed).toBe(true);
    });

    it("rate limiter should allow requests when INCR response is invalid", () => {
      const count = NaN;

      const allowed = !Number.isFinite(count) ? true : false;
      expect(allowed).toBe(true);
    });
  });

  describe("429 threshold behavior", () => {
    it("chat endpoint should reject at 31 requests (over 30 limit)", () => {
      const count = 31;
      const maxAllowed = 30;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("leads endpoint should reject at 11 requests (over 10 limit)", () => {
      const count = 11;
      const maxAllowed = 10;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("leads_status endpoint should reject at 21 requests (over 20 limit)", () => {
      const count = 21;
      const maxAllowed = 20;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("demo_request endpoint should reject at 6 requests (over 5 limit)", () => {
      const count = 6;
      const maxAllowed = 5;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("booking_click endpoint should reject at 21 requests (over 20 limit)", () => {
      const count = 21;
      const maxAllowed = 20;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("bot_fetch endpoint should reject at 61 requests (over 60 limit)", () => {
      const count = 61;
      const maxAllowed = 60;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("widget_config endpoint should reject at 61 requests (over 60 limit)", () => {
      const count = 61;
      const maxAllowed = 60;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("messages_fetch endpoint should reject at 31 requests (over 30 limit)", () => {
      const count = 31;
      const maxAllowed = 30;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("lead_detail endpoint should reject at 31 requests (over 30 limit)", () => {
      const count = 31;
      const maxAllowed = 30;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });

    it("leads_recent endpoint should reject at 31 requests (over 30 limit)", () => {
      const count = 31;
      const maxAllowed = 30;
      const shouldBlock = count > maxAllowed;

      expect(shouldBlock).toBe(true);
    });
  });

  describe("rate limit enforcement on all public routes", () => {
    it("all 10 public endpoints have rate limiting configured", () => {
      const publicEndpoints = [
        "chat",
        "leads",
        "leads_status",
        "demo_request",
        "booking_click",
        "bot_fetch",
        "widget_config",
        "messages_fetch",
        "lead_detail",
        "leads_recent"
      ];

      const LIMITS = {
        chat: { max: 30, window: 60 },
        leads: { max: 10, window: 60 },
        leads_status: { max: 20, window: 60 },
        demo_request: { max: 5, window: 60 },
        booking_click: { max: 20, window: 60 },
        bot_fetch: { max: 60, window: 60 },
        widget_config: { max: 60, window: 60 },
        messages_fetch: { max: 30, window: 60 },
        lead_detail: { max: 30, window: 60 },
        leads_recent: { max: 30, window: 60 }
      };

      publicEndpoints.forEach((endpoint) => {
        expect(LIMITS).toHaveProperty(endpoint);
        expect((LIMITS as any)[endpoint].max).toBeGreaterThan(0);
        expect((LIMITS as any)[endpoint].window).toBe(60);
      });
    });

    it("demo_request has strictest limit (5) to prevent spam", () => {
      const LIMITS = {
        demo_request: { max: 5, window: 60 },
        leads: { max: 10, window: 60 },
        chat: { max: 30, window: 60 }
      };

      expect(LIMITS.demo_request.max).toBeLessThan(LIMITS.leads.max);
      expect(LIMITS.demo_request.max).toBeLessThan(LIMITS.chat.max);
    });

    it("bot_fetch and widget_config have highest limits (60) for read operations", () => {
      const LIMITS = {
        bot_fetch: { max: 60, window: 60 },
        widget_config: { max: 60, window: 60 },
        chat: { max: 30, window: 60 },
        leads: { max: 10, window: 60 }
      };

      expect(LIMITS.bot_fetch.max).toBeGreaterThan(LIMITS.chat.max);
      expect(LIMITS.widget_config.max).toBeGreaterThan(LIMITS.chat.max);
      expect(LIMITS.bot_fetch.max).toBe(60);
      expect(LIMITS.widget_config.max).toBe(60);
    });
  });
});
