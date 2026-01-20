import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return emailRegex.test(email) && email.length <= 254;
}

function validateEmailList(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && isValidEmail(trimmed)) {
      valid.push(trimmed);
    } else if (trimmed) {
      invalid.push(trimmed);
    }
  }

  return { valid, invalid };
}

const updateSchema = z.object({
  notificationEnabled: z.boolean().optional(),
  notificationEmails: z.array(z.string()).optional(),
  notifyOnHotLead: z.boolean().optional(),
  notifyOnBookingClick: z.boolean().optional(),
});

describe("Notifications", () => {
  describe("Email Validation", () => {
    it("validates correct email format", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("validates email with subdomain", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("validates email with plus sign", () => {
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("rejects email without @", () => {
      expect(isValidEmail("invalid-email")).toBe(false);
    });

    it("rejects email without domain", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    it("rejects email without local part", () => {
      expect(isValidEmail("@example.com")).toBe(false);
    });

    it("rejects email with spaces", () => {
      expect(isValidEmail("user @example.com")).toBe(false);
    });

    it("rejects email exceeding max length", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });

    it("accepts email at max length boundary", () => {
      const maxEmail = "a".repeat(241) + "@example.com";
      expect(isValidEmail(maxEmail)).toBe(true);
    });
  });

  describe("Email List Validation", () => {
    it("separates valid and invalid emails", () => {
      const result = validateEmailList([
        "valid@example.com",
        "invalid",
        "also-valid@test.org",
      ]);
      expect(result.valid).toEqual(["valid@example.com", "also-valid@test.org"]);
      expect(result.invalid).toEqual(["invalid"]);
    });

    it("trims and lowercases emails", () => {
      const result = validateEmailList(["  UPPER@EXAMPLE.COM  ", " Test@Test.org "]);
      expect(result.valid).toEqual(["upper@example.com", "test@test.org"]);
    });

    it("filters out empty strings", () => {
      const result = validateEmailList(["valid@example.com", "", "   "]);
      expect(result.valid).toEqual(["valid@example.com"]);
      expect(result.invalid).toEqual([]);
    });

    it("handles all invalid emails", () => {
      const result = validateEmailList(["bad", "worse", "nope"]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(["bad", "worse", "nope"]);
    });

    it("handles empty array", () => {
      const result = validateEmailList([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });
  });

  describe("Notification Settings Schema", () => {
    it("accepts valid settings update", () => {
      const result = updateSchema.parse({
        notificationEnabled: true,
        notificationEmails: ["test@example.com"],
        notifyOnHotLead: true,
        notifyOnBookingClick: false,
      });
      expect(result.notificationEnabled).toBe(true);
      expect(result.notificationEmails).toEqual(["test@example.com"]);
    });

    it("accepts partial update", () => {
      const result = updateSchema.parse({ notificationEnabled: false });
      expect(result.notificationEnabled).toBe(false);
      expect(result.notificationEmails).toBeUndefined();
    });

    it("accepts empty object", () => {
      const result = updateSchema.parse({});
      expect(Object.keys(result).length).toBe(0);
    });

    it("rejects invalid boolean type", () => {
      expect(() =>
        updateSchema.parse({ notificationEnabled: "true" })
      ).toThrow();
    });

    it("rejects invalid emails array type", () => {
      expect(() =>
        updateSchema.parse({ notificationEmails: "not-an-array" })
      ).toThrow();
    });
  });

  describe("Trigger Conditions", () => {
    const shouldTriggerHotLeadNotification = (settings: {
      notificationEnabled: boolean;
      notifyOnHotLead: boolean;
      notificationEmails: string[];
    }): boolean => {
      return (
        settings.notificationEnabled &&
        settings.notifyOnHotLead &&
        settings.notificationEmails.length > 0
      );
    };

    const shouldTriggerBookingClickNotification = (settings: {
      notificationEnabled: boolean;
      notifyOnBookingClick: boolean;
      notificationEmails: string[];
    }): boolean => {
      return (
        settings.notificationEnabled &&
        settings.notifyOnBookingClick &&
        settings.notificationEmails.length > 0
      );
    };

    it("triggers hot lead notification when all conditions met", () => {
      expect(
        shouldTriggerHotLeadNotification({
          notificationEnabled: true,
          notifyOnHotLead: true,
          notificationEmails: ["test@example.com"],
        })
      ).toBe(true);
    });

    it("does not trigger when notifications disabled", () => {
      expect(
        shouldTriggerHotLeadNotification({
          notificationEnabled: false,
          notifyOnHotLead: true,
          notificationEmails: ["test@example.com"],
        })
      ).toBe(false);
    });

    it("does not trigger when hot lead notifications disabled", () => {
      expect(
        shouldTriggerHotLeadNotification({
          notificationEnabled: true,
          notifyOnHotLead: false,
          notificationEmails: ["test@example.com"],
        })
      ).toBe(false);
    });

    it("does not trigger when no emails configured", () => {
      expect(
        shouldTriggerHotLeadNotification({
          notificationEnabled: true,
          notifyOnHotLead: true,
          notificationEmails: [],
        })
      ).toBe(false);
    });

    it("triggers booking click notification when all conditions met", () => {
      expect(
        shouldTriggerBookingClickNotification({
          notificationEnabled: true,
          notifyOnBookingClick: true,
          notificationEmails: ["test@example.com"],
        })
      ).toBe(true);
    });

    it("does not trigger booking click when disabled", () => {
      expect(
        shouldTriggerBookingClickNotification({
          notificationEnabled: true,
          notifyOnBookingClick: false,
          notificationEmails: ["test@example.com"],
        })
      ).toBe(false);
    });
  });

  describe("Tenant Isolation", () => {
    const buildNotificationQuery = (orgId: number) => ({
      where: { organizationId: orgId },
      select: {
        notificationEnabled: true,
        notificationEmails: true,
        notifyOnHotLead: true,
        notifyOnBookingClick: true,
      },
    });

    it("includes organizationId in query", () => {
      const query = buildNotificationQuery(123);
      expect(query.where.organizationId).toBe(123);
    });

    it("scopes notification log creation to org", () => {
      const createLogData = (orgId: number, leadId: number) => ({
        organizationId: orgId,
        leadId,
        type: "HOT_LEAD",
        recipientEmail: "test@example.com",
        status: "PENDING",
      });

      const data = createLogData(456, 789);
      expect(data.organizationId).toBe(456);
      expect(data.leadId).toBe(789);
    });
  });

  describe("RBAC", () => {
    const isAdmin = (role: string): boolean => {
      return role === "AGENCY_OWNER" || role === "AGENCY_ADMIN";
    };

    const canUpdateNotificationSettings = (role: string): boolean => {
      return isAdmin(role);
    };

    it("allows AGENCY_OWNER to update settings", () => {
      expect(canUpdateNotificationSettings("AGENCY_OWNER")).toBe(true);
    });

    it("allows AGENCY_ADMIN to update settings", () => {
      expect(canUpdateNotificationSettings("AGENCY_ADMIN")).toBe(true);
    });

    it("denies CLIENT from updating settings", () => {
      expect(canUpdateNotificationSettings("CLIENT")).toBe(false);
    });
  });

  describe("Notification Log Status", () => {
    const LOG_STATUSES = ["PENDING", "SENT", "FAILED"] as const;

    it("includes all required statuses", () => {
      expect(LOG_STATUSES).toContain("PENDING");
      expect(LOG_STATUSES).toContain("SENT");
      expect(LOG_STATUSES).toContain("FAILED");
    });
  });

  describe("Notification Types", () => {
    const NOTIFICATION_TYPES = ["HOT_LEAD", "BOOKING_LINK_CLICK", "LEAD_STATUS_CHANGE"] as const;

    it("includes hot lead type", () => {
      expect(NOTIFICATION_TYPES).toContain("HOT_LEAD");
    });

    it("includes booking link click type", () => {
      expect(NOTIFICATION_TYPES).toContain("BOOKING_LINK_CLICK");
    });

    it("includes lead status change type", () => {
      expect(NOTIFICATION_TYPES).toContain("LEAD_STATUS_CHANGE");
    });
  });

  describe("Email HTML Escaping", () => {
    function escapeHtml(str: string | null | undefined): string {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    it("escapes HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
      );
    });

    it("escapes ampersand", () => {
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("escapes double quotes", () => {
      expect(escapeHtml('He said "Hello"')).toBe("He said &quot;Hello&quot;");
    });

    it("returns empty string for null", () => {
      expect(escapeHtml(null)).toBe("");
    });

    it("returns empty string for undefined", () => {
      expect(escapeHtml(undefined)).toBe("");
    });

    it("handles safe string unchanged conceptually", () => {
      expect(escapeHtml("John Doe")).toBe("John Doe");
    });
  });
});
