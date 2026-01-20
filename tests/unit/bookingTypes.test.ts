import { describe, it, expect } from "vitest";
import {
  BookingFlowState,
  ResponseDirectiveType,
  BookingFlowEventType,
  BOOKING_FLOW_CONFIG,
  BOOKING_INTENT_KEYWORDS,
  CANCEL_KEYWORDS,
  RESTART_KEYWORDS,
  BACK_KEYWORDS,
  isBookingFlowState,
  isResponseDirectiveType,
  brand,
  assertType,
  type ServiceId,
  type EmailAddress,
  type PhoneNumber,
} from "@/lib/booking/types";

describe("BookingFlowState", () => {
  it("has all expected states", () => {
    expect(BookingFlowState.IDLE).toBe("IDLE");
    expect(BookingFlowState.SERVICE_SELECTION).toBe("SERVICE_SELECTION");
    expect(BookingFlowState.LEAD_NAME).toBe("LEAD_NAME");
    expect(BookingFlowState.LEAD_PHONE).toBe("LEAD_PHONE");
    expect(BookingFlowState.LEAD_EMAIL).toBe("LEAD_EMAIL");
    expect(BookingFlowState.COMPLETE).toBe("COMPLETE");
  });

  it("has exactly 6 states", () => {
    expect(Object.keys(BookingFlowState).length).toBe(6);
  });
});

describe("ResponseDirectiveType", () => {
  it("has all expected directive types", () => {
    expect(ResponseDirectiveType.SHOW_SERVICE_PICKER).toBe("SHOW_SERVICE_PICKER");
    expect(ResponseDirectiveType.ASK_FOR_NAME).toBe("ASK_FOR_NAME");
    expect(ResponseDirectiveType.ASK_FOR_PHONE).toBe("ASK_FOR_PHONE");
    expect(ResponseDirectiveType.ASK_FOR_EMAIL).toBe("ASK_FOR_EMAIL");
    expect(ResponseDirectiveType.SHOW_BOOKING_LINK).toBe("SHOW_BOOKING_LINK");
    expect(ResponseDirectiveType.SHOW_ERROR).toBe("SHOW_ERROR");
    expect(ResponseDirectiveType.CONTINUE_CHAT).toBe("CONTINUE_CHAT");
  });

  it("has exactly 7 directive types", () => {
    expect(Object.keys(ResponseDirectiveType).length).toBe(7);
  });
});

describe("BookingFlowEventType", () => {
  it("has all expected event types", () => {
    expect(BookingFlowEventType.FLOW_STARTED).toBe("BOOKING_FLOW_STARTED");
    expect(BookingFlowEventType.SERVICE_SELECTED).toBe("SERVICE_SELECTED");
    expect(BookingFlowEventType.NAME_CAPTURED).toBe("LEAD_NAME_CAPTURED");
    expect(BookingFlowEventType.PHONE_CAPTURED).toBe("LEAD_PHONE_CAPTURED");
    expect(BookingFlowEventType.EMAIL_CAPTURED).toBe("LEAD_EMAIL_CAPTURED");
    expect(BookingFlowEventType.LEAD_CREATED).toBe("LEAD_CAPTURED");
    expect(BookingFlowEventType.BOOKING_LINK_SHOWN).toBe("BOOKING_LINK_SHOWN");
    expect(BookingFlowEventType.BOOKING_LINK_CLICKED).toBe("BOOKING_LINK_CLICKED");
    expect(BookingFlowEventType.FLOW_CANCELLED).toBe("BOOKING_FLOW_CANCELLED");
    expect(BookingFlowEventType.FLOW_RESTARTED).toBe("BOOKING_FLOW_RESTARTED");
    expect(BookingFlowEventType.VALIDATION_FAILED).toBe("VALIDATION_FAILED");
    expect(BookingFlowEventType.FLOW_TIMEOUT).toBe("BOOKING_FLOW_TIMEOUT");
    expect(BookingFlowEventType.FLOW_ABANDONED).toBe("BOOKING_FLOW_ABANDONED");
  });
});

describe("BOOKING_FLOW_CONFIG", () => {
  it("has correct configuration values", () => {
    expect(BOOKING_FLOW_CONFIG.MAX_RETRIES_PER_STEP).toBe(5);
    expect(BOOKING_FLOW_CONFIG.FLOW_TIMEOUT_MS).toBe(30 * 60 * 1000);
    expect(BOOKING_FLOW_CONFIG.MIN_NAME_LENGTH).toBe(2);
    expect(BOOKING_FLOW_CONFIG.MAX_NAME_LENGTH).toBe(100);
    expect(BOOKING_FLOW_CONFIG.MIN_PHONE_DIGITS).toBe(10);
    expect(BOOKING_FLOW_CONFIG.MAX_PHONE_DIGITS).toBe(15);
    expect(BOOKING_FLOW_CONFIG.MAX_EMAIL_LENGTH).toBe(254);
    expect(BOOKING_FLOW_CONFIG.MAX_FLOWS_PER_IP_PER_HOUR).toBe(10);
  });
});

describe("Intent Keywords", () => {
  it("BOOKING_INTENT_KEYWORDS contains booking-related keywords", () => {
    expect(BOOKING_INTENT_KEYWORDS).toContain("book");
    expect(BOOKING_INTENT_KEYWORDS).toContain("appointment");
    expect(BOOKING_INTENT_KEYWORDS).toContain("schedule");
    expect(BOOKING_INTENT_KEYWORDS).toContain("price");
    expect(BOOKING_INTENT_KEYWORDS.length).toBeGreaterThan(10);
  });

  it("CANCEL_KEYWORDS contains cancel-related keywords", () => {
    expect(CANCEL_KEYWORDS).toContain("cancel");
    expect(CANCEL_KEYWORDS).toContain("stop");
    expect(CANCEL_KEYWORDS).toContain("no thanks");
  });

  it("RESTART_KEYWORDS contains restart-related keywords", () => {
    expect(RESTART_KEYWORDS).toContain("restart");
    expect(RESTART_KEYWORDS).toContain("start over");
    expect(RESTART_KEYWORDS).toContain("reset");
  });

  it("BACK_KEYWORDS contains back-related keywords", () => {
    expect(BACK_KEYWORDS).toContain("back");
    expect(BACK_KEYWORDS).toContain("previous");
    expect(BACK_KEYWORDS).toContain("undo");
  });
});

describe("isBookingFlowState", () => {
  it("returns true for valid states", () => {
    expect(isBookingFlowState("IDLE")).toBe(true);
    expect(isBookingFlowState("SERVICE_SELECTION")).toBe(true);
    expect(isBookingFlowState("LEAD_NAME")).toBe(true);
    expect(isBookingFlowState("LEAD_PHONE")).toBe(true);
    expect(isBookingFlowState("LEAD_EMAIL")).toBe(true);
    expect(isBookingFlowState("COMPLETE")).toBe(true);
  });

  it("returns false for invalid states", () => {
    expect(isBookingFlowState("INVALID")).toBe(false);
    expect(isBookingFlowState("")).toBe(false);
    expect(isBookingFlowState(null)).toBe(false);
    expect(isBookingFlowState(undefined)).toBe(false);
    expect(isBookingFlowState(123)).toBe(false);
    expect(isBookingFlowState({})).toBe(false);
  });
});

describe("isResponseDirectiveType", () => {
  it("returns true for valid directive types", () => {
    expect(isResponseDirectiveType("SHOW_SERVICE_PICKER")).toBe(true);
    expect(isResponseDirectiveType("ASK_FOR_NAME")).toBe(true);
    expect(isResponseDirectiveType("ASK_FOR_PHONE")).toBe(true);
    expect(isResponseDirectiveType("ASK_FOR_EMAIL")).toBe(true);
    expect(isResponseDirectiveType("SHOW_BOOKING_LINK")).toBe(true);
    expect(isResponseDirectiveType("SHOW_ERROR")).toBe(true);
    expect(isResponseDirectiveType("CONTINUE_CHAT")).toBe(true);
  });

  it("returns false for invalid directive types", () => {
    expect(isResponseDirectiveType("INVALID")).toBe(false);
    expect(isResponseDirectiveType("")).toBe(false);
    expect(isResponseDirectiveType(null)).toBe(false);
    expect(isResponseDirectiveType(undefined)).toBe(false);
  });
});

describe("brand", () => {
  it("creates branded type for ServiceId", () => {
    const serviceId = brand<string, "ServiceId">("svc_123");
    expect(serviceId).toBe("svc_123");
    const typed: ServiceId = serviceId;
    expect(typed).toBe("svc_123");
  });

  it("creates branded type for EmailAddress", () => {
    const email = brand<string, "EmailAddress">("test@example.com");
    expect(email).toBe("test@example.com");
    const typed: EmailAddress = email;
    expect(typed).toBe("test@example.com");
  });

  it("creates branded type for PhoneNumber", () => {
    const phone = brand<string, "PhoneNumber">("1234567890");
    expect(phone).toBe("1234567890");
    const typed: PhoneNumber = phone;
    expect(typed).toBe("1234567890");
  });
});

describe("assertType", () => {
  it("returns value when validation passes", () => {
    const validator = (v: unknown): v is string => typeof v === "string";
    const result = assertType("test", validator, "Expected string");
    expect(result).toBe("test");
  });

  it("throws TypeError when validation fails", () => {
    const validator = (v: unknown): v is string => typeof v === "string";
    expect(() => {
      assertType(123, validator, "Expected string");
    }).toThrow(TypeError);
    expect(() => {
      assertType(123, validator, "Expected string");
    }).toThrow("Expected string");
  });

  it("works with isBookingFlowState", () => {
    const state = assertType("IDLE", isBookingFlowState, "Invalid state");
    expect(state).toBe("IDLE");
  });

  it("throws for invalid state with isBookingFlowState", () => {
    expect(() => {
      assertType("INVALID", isBookingFlowState, "Invalid booking flow state");
    }).toThrow("Invalid booking flow state");
  });
});
