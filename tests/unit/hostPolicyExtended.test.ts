import { describe, it, expect } from "vitest";
import { isHostAllowed, getRequestHost, getOriginHost } from "../../src/lib/public/hostPolicy";

describe("Host Policy - Extended Tests", () => {
  describe("isHostAllowed rejects disallowed origins", () => {
    it("rejects origin not in allowlist", () => {
      const allowlist = ["trusted.com", "allowed.org"];
      expect(isHostAllowed(allowlist, "https://malicious.com", null)).toBe(false);
    });

    it("rejects host not in allowlist", () => {
      const allowlist = ["trusted.com"];
      expect(isHostAllowed(allowlist, null, "untrusted.com")).toBe(false);
    });

    it("rejects when no origin or host provided", () => {
      const allowlist = ["trusted.com"];
      expect(isHostAllowed(allowlist, null, null)).toBe(false);
    });

    it("accepts origin in allowlist", () => {
      const allowlist = ["trusted.com"];
      expect(isHostAllowed(allowlist, "https://trusted.com", null)).toBe(true);
    });

    it("accepts subdomain of allowed domain", () => {
      const allowlist = ["trusted.com"];
      expect(isHostAllowed(allowlist, "https://sub.trusted.com", null)).toBe(true);
    });

    it("allows all when allowlist is empty", () => {
      expect(isHostAllowed([], "https://any.com", null)).toBe(true);
      expect(isHostAllowed(null, "https://any.com", null)).toBe(true);
      expect(isHostAllowed(undefined, "https://any.com", null)).toBe(true);
    });

    it("is case insensitive", () => {
      const allowlist = ["Trusted.COM"];
      expect(isHostAllowed(allowlist, "https://TRUSTED.com", null)).toBe(true);
    });
  });

  describe("getRequestHost", () => {
    it("extracts host from x-forwarded-host", () => {
      const req = new Request("https://example.com", {
        headers: { "x-forwarded-host": "forwarded.com:8080" },
      });
      expect(getRequestHost(req)).toBe("forwarded.com");
    });

    it("falls back to host header", () => {
      const req = new Request("https://example.com", {
        headers: { host: "original.com" },
      });
      expect(getRequestHost(req)).toBe("original.com");
    });

    it("returns null when no host headers", () => {
      const req = new Request("https://example.com");
      expect(getRequestHost(req)).toBeNull();
    });

    it("normalizes host to lowercase", () => {
      const req = new Request("https://example.com", {
        headers: { host: "UPPERCASE.COM" },
      });
      expect(getRequestHost(req)).toBe("uppercase.com");
    });
  });

  describe("getOriginHost", () => {
    it("extracts hostname from origin URL", () => {
      const req = new Request("https://example.com", {
        headers: { origin: "https://widget-host.com:3000" },
      });
      expect(getOriginHost(req)).toBe("widget-host.com");
    });

    it("returns null when origin header missing", () => {
      const req = new Request("https://example.com");
      expect(getOriginHost(req)).toBeNull();
    });

    it("returns null for invalid origin URL", () => {
      const req = new Request("https://example.com", {
        headers: { origin: "not-a-url" },
      });
      expect(getOriginHost(req)).toBeNull();
    });

    it("normalizes to lowercase", () => {
      const req = new Request("https://example.com", {
        headers: { origin: "https://UPPERCASE.org" },
      });
      expect(getOriginHost(req)).toBe("uppercase.org");
    });
  });
});
