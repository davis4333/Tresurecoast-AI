import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  logDemoRequest,
  logNewLead,
  sendDemoRequestWebhook,
  sendLeadWebhook,
  DemoRequestPayload,
  LeadPayload,
} from "../../src/lib/notifications/webhooks";

describe("logDemoRequest", () => {
  it("logs structured demo request", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload: DemoRequestPayload = {
      id: 123,
      name: "John Doe",
      email: "john@example.com",
      businessName: "Acme Corp",
      phone: "555-1234",
      createdAt: "2025-01-19T12:00:00.000Z",
    };

    logDemoRequest(payload);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[DEMO_REQUEST] name=John Doe email=john@example.com business=Acme Corp phone=555-1234 id=123"
    );
    consoleSpy.mockRestore();
  });

  it("handles null phone", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload: DemoRequestPayload = {
      id: 456,
      name: "Jane",
      email: "jane@example.com",
      businessName: "Test Co",
      phone: null,
      createdAt: "2025-01-19T12:00:00.000Z",
    };

    logDemoRequest(payload);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[DEMO_REQUEST] name=Jane email=jane@example.com business=Test Co phone= id=456"
    );
    consoleSpy.mockRestore();
  });
});

describe("logNewLead", () => {
  it("logs structured lead notification", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload: LeadPayload = {
      leadPublicId: "abc-123",
      orgId: 1,
      botId: 2,
      name: "Lead Name",
      email: "lead@example.com",
      phone: "555-9999",
      source: "widget",
    };

    logNewLead(payload);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[NEW_LEAD] orgId=1 botId=2 leadId=abc-123 name=Lead Name phone=555-9999 source=widget"
    );
    consoleSpy.mockRestore();
  });

  it("handles null fields", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload: LeadPayload = {
      leadPublicId: "xyz-789",
      orgId: 5,
      botId: 10,
      name: null,
      email: null,
      phone: null,
      source: "api",
    };

    logNewLead(payload);

    expect(consoleSpy).toHaveBeenCalledWith(
      "[NEW_LEAD] orgId=5 botId=10 leadId=xyz-789 name= phone= source=api"
    );
    consoleSpy.mockRestore();
  });
});

describe("sendDemoRequestWebhook", () => {
  beforeEach(() => {
    vi.stubEnv("DEMO_REQUEST_WEBHOOK_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns false when env var not set", async () => {
    vi.stubEnv("DEMO_REQUEST_WEBHOOK_URL", "");
    const payload: DemoRequestPayload = {
      id: 1,
      name: "Test",
      email: "test@example.com",
      businessName: "Test",
      phone: null,
      createdAt: "2025-01-19T12:00:00.000Z",
    };

    const result = await sendDemoRequestWebhook(payload);
    expect(result).toBe(false);
  });

  it("sends webhook when env var is set and returns true on success", async () => {
    vi.stubEnv("DEMO_REQUEST_WEBHOOK_URL", "https://example.com/webhook");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", mockFetch);

    const payload: DemoRequestPayload = {
      id: 1,
      name: "Test",
      email: "test@example.com",
      businessName: "Test",
      phone: null,
      createdAt: "2025-01-19T12:00:00.000Z",
    };

    const result = await sendDemoRequestWebhook(payload);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("returns false on webhook failure (non-2xx status)", async () => {
    vi.stubEnv("DEMO_REQUEST_WEBHOOK_URL", "https://example.com/webhook");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", mockFetch);

    const payload: DemoRequestPayload = {
      id: 1,
      name: "Test",
      email: "test@example.com",
      businessName: "Test",
      phone: null,
      createdAt: "2025-01-19T12:00:00.000Z",
    };

    const result = await sendDemoRequestWebhook(payload);

    expect(result).toBe(false);
  });

  it("returns false on network error (fails open)", async () => {
    vi.stubEnv("DEMO_REQUEST_WEBHOOK_URL", "https://example.com/webhook");

    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const payload: DemoRequestPayload = {
      id: 1,
      name: "Test",
      email: "test@example.com",
      businessName: "Test",
      phone: null,
      createdAt: "2025-01-19T12:00:00.000Z",
    };

    const result = await sendDemoRequestWebhook(payload);

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("sendLeadWebhook", () => {
  beforeEach(() => {
    vi.stubEnv("LEAD_WEBHOOK_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns false when env var not set", async () => {
    vi.stubEnv("LEAD_WEBHOOK_URL", "");
    const payload: LeadPayload = {
      leadPublicId: "abc-123",
      orgId: 1,
      botId: 2,
      name: "Test",
      email: "test@example.com",
      phone: null,
      source: "widget",
    };

    const result = await sendLeadWebhook(payload);
    expect(result).toBe(false);
  });

  it("sends webhook when env var is set and returns true on success", async () => {
    vi.stubEnv("LEAD_WEBHOOK_URL", "https://example.com/lead-webhook");

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", mockFetch);

    const payload: LeadPayload = {
      leadPublicId: "abc-123",
      orgId: 1,
      botId: 2,
      name: "Test",
      email: "test@example.com",
      phone: "555-1234",
      source: "widget",
    };

    const result = await sendLeadWebhook(payload);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/lead-webhook",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("returns false on webhook failure (fails open)", async () => {
    vi.stubEnv("LEAD_WEBHOOK_URL", "https://example.com/lead-webhook");

    const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
    vi.stubGlobal("fetch", mockFetch);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const payload: LeadPayload = {
      leadPublicId: "abc-123",
      orgId: 1,
      botId: 2,
      name: "Test",
      email: null,
      phone: null,
      source: "api",
    };

    const result = await sendLeadWebhook(payload);

    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });
});
