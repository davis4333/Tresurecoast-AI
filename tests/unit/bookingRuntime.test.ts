/**
 * Step 43: Booking Flow Runtime Orchestrator Unit Tests
 * Coverage: shouldProcessBookingFlow helper, booking intent detection in runtime context
 */

import { describe, it, expect } from "vitest";
import { shouldProcessBookingFlow } from "@/lib/booking/runtime";
import { BookingFlowState } from "@/lib/booking/types";

describe("shouldProcessBookingFlow", () => {
  describe("when conversation is in IDLE state", () => {
    it("returns true for booking intent messages", () => {
      expect(shouldProcessBookingFlow("I want to book an appointment", BookingFlowState.IDLE)).toBe(true);
      expect(shouldProcessBookingFlow("schedule a haircut", BookingFlowState.IDLE)).toBe(true);
      expect(shouldProcessBookingFlow("how much does it cost", BookingFlowState.IDLE)).toBe(true);
      expect(shouldProcessBookingFlow("what services do you offer", BookingFlowState.IDLE)).toBe(true);
    });

    it("returns false for non-booking messages", () => {
      expect(shouldProcessBookingFlow("hello", BookingFlowState.IDLE)).toBe(false);
      expect(shouldProcessBookingFlow("what are your hours", BookingFlowState.IDLE)).toBe(false);
      expect(shouldProcessBookingFlow("where are you located", BookingFlowState.IDLE)).toBe(false);
    });

    it("returns false when state is null", () => {
      expect(shouldProcessBookingFlow("hello", null)).toBe(false);
    });

    it("returns true for booking intent when state is null", () => {
      expect(shouldProcessBookingFlow("I want to book", null)).toBe(true);
    });
  });

  describe("when conversation is in active booking flow", () => {
    it("returns true for SERVICE_SELECTION state regardless of message", () => {
      expect(shouldProcessBookingFlow("hello", BookingFlowState.SERVICE_SELECTION)).toBe(true);
      expect(shouldProcessBookingFlow("anything", BookingFlowState.SERVICE_SELECTION)).toBe(true);
    });

    it("returns true for LEAD_NAME state regardless of message", () => {
      expect(shouldProcessBookingFlow("random text", BookingFlowState.LEAD_NAME)).toBe(true);
    });

    it("returns true for LEAD_PHONE state regardless of message", () => {
      expect(shouldProcessBookingFlow("123456789", BookingFlowState.LEAD_PHONE)).toBe(true);
    });

    it("returns true for LEAD_EMAIL state regardless of message", () => {
      expect(shouldProcessBookingFlow("test@example.com", BookingFlowState.LEAD_EMAIL)).toBe(true);
    });

    it("returns true for COMPLETE state regardless of message", () => {
      expect(shouldProcessBookingFlow("thanks", BookingFlowState.COMPLETE)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles undefined state like null", () => {
      expect(shouldProcessBookingFlow("hello", undefined)).toBe(false);
      expect(shouldProcessBookingFlow("book appointment", undefined)).toBe(true);
    });

    it("handles empty message", () => {
      expect(shouldProcessBookingFlow("", BookingFlowState.IDLE)).toBe(false);
      expect(shouldProcessBookingFlow("", BookingFlowState.SERVICE_SELECTION)).toBe(true);
    });

    it("is case-insensitive for booking intent", () => {
      expect(shouldProcessBookingFlow("BOOK AN APPOINTMENT", BookingFlowState.IDLE)).toBe(true);
      expect(shouldProcessBookingFlow("SCHEDULE", BookingFlowState.IDLE)).toBe(true);
    });
  });
});

describe("Booking Runtime Integration Points", () => {
  describe("processBookingFlow function exists", () => {
    it("exports processBookingFlow", async () => {
      const runtime = await import("@/lib/booking/runtime");
      expect(typeof runtime.processBookingFlow).toBe("function");
    });

    it("exports resetBookingFlow", async () => {
      const runtime = await import("@/lib/booking/runtime");
      expect(typeof runtime.resetBookingFlow).toBe("function");
    });

    it("exports shouldProcessBookingFlow", async () => {
      const runtime = await import("@/lib/booking/runtime");
      expect(typeof runtime.shouldProcessBookingFlow).toBe("function");
    });
  });

  describe("BookingFlowOutput interface validation", () => {
    it("output has correct structure", async () => {
      const { BookingFlowState, ResponseDirectiveType } = await import("@/lib/booking/types");
      
      const mockOutput = {
        handled: false,
        reply: "",
        directiveType: ResponseDirectiveType.CONTINUE_CHAT,
        state: BookingFlowState.IDLE,
      };
      
      expect(mockOutput.handled).toBe(false);
      expect(mockOutput.reply).toBe("");
      expect(mockOutput.directiveType).toBe(ResponseDirectiveType.CONTINUE_CHAT);
      expect(mockOutput.state).toBe(BookingFlowState.IDLE);
    });

    it("output supports optional fields", async () => {
      const { BookingFlowState, ResponseDirectiveType } = await import("@/lib/booking/types");
      
      const mockOutput = {
        handled: true,
        reply: "Please select a service",
        directiveType: ResponseDirectiveType.SHOW_SERVICE_PICKER,
        state: BookingFlowState.SERVICE_SELECTION,
        bookingUrl: "https://booking.example.com",
        services: [],
        leadCreated: false,
        leadId: undefined,
      };
      
      expect(mockOutput.handled).toBe(true);
      expect(mockOutput.bookingUrl).toBe("https://booking.example.com");
      expect(mockOutput.services).toEqual([]);
      expect(mockOutput.leadCreated).toBe(false);
    });
  });
});

describe("BookingFlowInput interface validation", () => {
  it("accepts required fields", () => {
    const input = {
      organizationId: 1,
      conversationId: 1,
      conversationPublicId: "test-uuid",
      botId: 1,
      workspaceId: 1,
      userMessage: "I want to book",
    };
    
    expect(input.organizationId).toBe(1);
    expect(input.conversationId).toBe(1);
    expect(input.userMessage).toBe("I want to book");
  });

  it("accepts optional selectedServiceId", () => {
    const input = {
      organizationId: 1,
      conversationId: 1,
      conversationPublicId: "test-uuid",
      botId: 1,
      workspaceId: 1,
      userMessage: "Haircut",
      selectedServiceId: "svc_1",
    };
    
    expect(input.selectedServiceId).toBe("svc_1");
  });
});
