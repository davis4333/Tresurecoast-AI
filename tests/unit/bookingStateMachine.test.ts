/**
 * Step 42: Booking Flow State Machine Unit Tests
 * Coverage: state transitions, validators, edge cases
 */

import { describe, it, expect } from "vitest";
import {
  initBookingContext,
  isBookingIntent,
  isCancel,
  isRestart,
  isBack,
  transition,
} from "@/lib/booking/stateMachine";
import {
  BookingFlowState,
  ResponseDirectiveType,
  type SelectedService,
  type UserInput,
  type ServiceId,
  type Url,
  brand,
} from "@/lib/booking/types";

const mockServices: SelectedService[] = [
  {
    id: brand<string, "ServiceId">("svc_1"),
    name: "Haircut",
    bookingUrl: brand<string, "Url">("https://booking.example.com/haircut"),
    paymentUrl: null,
  },
  {
    id: brand<string, "ServiceId">("svc_2"),
    name: "Beard Trim",
    bookingUrl: null,
    paymentUrl: brand<string, "Url">("https://pay.example.com/beard-trim"),
  },
  {
    id: brand<string, "ServiceId">("svc_3"),
    name: "Hot Towel Shave",
    bookingUrl: null,
    paymentUrl: null,
  },
];

describe("Booking Intent Detection", () => {
  it("detects booking intent from common keywords", () => {
    expect(isBookingIntent("I want to book an appointment")).toBe(true);
    expect(isBookingIntent("schedule a haircut")).toBe(true);
    expect(isBookingIntent("how much does it cost")).toBe(true);
    expect(isBookingIntent("what services do you offer")).toBe(true);
    expect(isBookingIntent("are you available tomorrow")).toBe(true);
  });

  it("does not trigger on normal conversation", () => {
    expect(isBookingIntent("hello")).toBe(false);
    expect(isBookingIntent("what are your hours")).toBe(false);
    expect(isBookingIntent("where are you located")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isBookingIntent("BOOK AN APPOINTMENT")).toBe(true);
    expect(isBookingIntent("Book")).toBe(true);
  });
});

describe("Cancel/Restart/Back Detection", () => {
  it("detects cancel commands", () => {
    expect(isCancel("cancel")).toBe(true);
    expect(isCancel("nevermind")).toBe(true);
    expect(isCancel("stop")).toBe(true);
    expect(isCancel("quit")).toBe(true);
  });

  it("detects restart commands", () => {
    expect(isRestart("restart")).toBe(true);
    expect(isRestart("start over")).toBe(true);
    expect(isRestart("reset")).toBe(true);
  });

  it("detects back commands", () => {
    expect(isBack("back")).toBe(true);
    expect(isBack("go back")).toBe(true);
    expect(isBack("previous")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isCancel("CANCEL")).toBe(true);
    expect(isRestart("START OVER")).toBe(true);
    expect(isBack("BACK")).toBe(true);
  });
});

describe("State Machine: IDLE → SERVICE_SELECTION", () => {
  it("transitions on booking intent when services exist", () => {
    const context = initBookingContext();
    const input: UserInput = { text: "I want to book an appointment" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.SERVICE_SELECTION);
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_SERVICE_PICKER);
    expect(result.directive.services).toEqual(mockServices);
    expect(result.shouldPersist).toBe(true);
  });

  it("stays IDLE if no booking intent", () => {
    const context = initBookingContext();
    const input: UserInput = { text: "hello" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.IDLE);
    expect(result.directive.type).toBe(ResponseDirectiveType.CONTINUE_CHAT);
    expect(result.shouldPersist).toBe(false);
  });

  it("shows error if no services configured", () => {
    const context = initBookingContext();
    const input: UserInput = { text: "book appointment" };

    const result = transition(context, input, []);

    expect(result.state).toBe(BookingFlowState.IDLE);
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_ERROR);
    expect(result.directive.message).toContain("no services");
  });
});

describe("State Machine: SERVICE_SELECTION → LEAD_NAME", () => {
  const context = {
    state: BookingFlowState.SERVICE_SELECTION,
    selectedService: null,
    leadDraft: {},
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
    retryCount: 0,
    version: "1.0" as const,
  };

  it("transitions with explicit service ID", () => {
    const input: UserInput = {
      text: "haircut",
      selectedServiceId: brand<string, "ServiceId">("svc_1"),
    };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_NAME);
    expect(result.context.selectedService?.id).toBe("svc_1");
    expect(result.directive.type).toBe(ResponseDirectiveType.ASK_FOR_NAME);
    expect(result.shouldPersist).toBe(true);
  });

  it("transitions with service name match", () => {
    const input: UserInput = { text: "beard trim" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_NAME);
    expect(result.context.selectedService?.name).toBe("Beard Trim");
  });

  it("stays in SERVICE_SELECTION if invalid selection", () => {
    const input: UserInput = { text: "invalid service that does not exist" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.SERVICE_SELECTION);
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_SERVICE_PICKER);
  });
});

describe("State Machine: LEAD_NAME → LEAD_PHONE", () => {
  const context = {
    state: BookingFlowState.LEAD_NAME,
    selectedService: mockServices[0],
    leadDraft: {},
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
    retryCount: 0,
    version: "1.0" as const,
  };

  it("transitions with valid name", () => {
    const input: UserInput = { text: "John Smith" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_PHONE);
    expect(result.context.leadDraft.name).toBe("John Smith");
    expect(result.directive.type).toBe(ResponseDirectiveType.ASK_FOR_PHONE);
    expect(result.shouldPersist).toBe(true);
  });

  it("stays in LEAD_NAME if invalid name", () => {
    const input: UserInput = { text: "A" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_NAME);
    expect(result.directive.type).toBe(ResponseDirectiveType.ASK_FOR_NAME);
    expect(result.directive.error).toBeTruthy();
  });
});

describe("State Machine: LEAD_PHONE → LEAD_EMAIL", () => {
  const context = {
    state: BookingFlowState.LEAD_PHONE,
    selectedService: mockServices[0],
    leadDraft: { name: "John Smith" },
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
    retryCount: 0,
    version: "1.0" as const,
  };

  it("transitions with valid phone", () => {
    const input: UserInput = { text: "(123) 456-7890" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_EMAIL);
    expect(result.context.leadDraft.phone).toBe("1234567890");
    expect(result.directive.type).toBe(ResponseDirectiveType.ASK_FOR_EMAIL);
    expect(result.shouldPersist).toBe(true);
  });

  it("stays in LEAD_PHONE if invalid phone", () => {
    const input: UserInput = { text: "123" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_PHONE);
    expect(result.directive.error).toBeTruthy();
  });
});

describe("State Machine: LEAD_EMAIL → COMPLETE", () => {
  const context = {
    state: BookingFlowState.LEAD_EMAIL,
    selectedService: mockServices[0],
    leadDraft: { name: "John Smith", phone: "1234567890" as any },
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
    retryCount: 0,
    version: "1.0" as const,
  };

  it("transitions with valid email and shows booking link", () => {
    const input: UserInput = { text: "john@example.com" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.COMPLETE);
    expect(result.context.leadDraft.email).toBe("john@example.com");
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_BOOKING_LINK);
    expect(result.directive.bookingUrl).toBe(mockServices[0]?.bookingUrl);
    expect(result.shouldPersist).toBe(true);
  });

  it("handles service with paymentUrl instead of bookingUrl", () => {
    const contextWithDifferentService = {
      ...context,
      selectedService: mockServices[1],
    };
    const input: UserInput = { text: "john@example.com" };

    const result = transition(contextWithDifferentService, input, mockServices);

    expect(result.directive.bookingUrl).toBe(mockServices[1]?.paymentUrl);
  });

  it("handles service with no booking URL", () => {
    const contextWithNoUrl = {
      ...context,
      selectedService: mockServices[2],
    };
    const input: UserInput = { text: "john@example.com" };

    const result = transition(contextWithNoUrl, input, mockServices);

    expect(result.state).toBe(BookingFlowState.COMPLETE);
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_ERROR);
    expect(result.directive.message).toContain("contact you soon");
  });

  it("stays in LEAD_EMAIL if invalid email", () => {
    const input: UserInput = { text: "notanemail" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_EMAIL);
    expect(result.directive.error).toBeTruthy();
  });
});

describe("Global Commands: Cancel", () => {
  it("resets to IDLE from any state", () => {
    const states = [
      BookingFlowState.SERVICE_SELECTION,
      BookingFlowState.LEAD_NAME,
      BookingFlowState.LEAD_PHONE,
      BookingFlowState.LEAD_EMAIL,
    ];

    for (const state of states) {
      const context = {
        state,
        selectedService: mockServices[0],
        leadDraft: { name: "Test" },
        startedAt: new Date().toISOString(),
        completedAt: null,
        errors: [],
        retryCount: 0,
        version: "1.0" as const,
      };
      const input: UserInput = { text: "cancel" };

      const result = transition(context, input, mockServices);

      expect(result.state).toBe(BookingFlowState.IDLE);
      expect(result.context.leadDraft).toEqual({});
      expect(result.shouldPersist).toBe(true);
    }
  });
});

describe("Global Commands: Restart", () => {
  it("goes to SERVICE_SELECTION from any state", () => {
    const context = {
      state: BookingFlowState.LEAD_PHONE,
      selectedService: mockServices[0],
      leadDraft: { name: "Test" },
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
      retryCount: 0,
      version: "1.0" as const,
    };
    const input: UserInput = { text: "restart" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.SERVICE_SELECTION);
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_SERVICE_PICKER);
  });
});

describe("Global Commands: Back", () => {
  it("goes to previous state", () => {
    const context = {
      state: BookingFlowState.LEAD_PHONE,
      selectedService: mockServices[0],
      leadDraft: { name: "Test" },
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
      retryCount: 0,
      version: "1.0" as const,
    };
    const input: UserInput = { text: "back" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.LEAD_NAME);
    expect(result.directive.type).toBe(ResponseDirectiveType.ASK_FOR_NAME);
  });

  it("goes to IDLE from SERVICE_SELECTION", () => {
    const context = {
      state: BookingFlowState.SERVICE_SELECTION,
      selectedService: null,
      leadDraft: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
      retryCount: 0,
      version: "1.0" as const,
    };
    const input: UserInput = { text: "back" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe(BookingFlowState.IDLE);
  });
});

describe("Complete Flow: Happy Path", () => {
  it("completes full booking flow", () => {
    let context = initBookingContext();

    // Step 1: Book intent
    let result = transition(context, { text: "I want to book" }, mockServices);
    expect(result.state).toBe(BookingFlowState.SERVICE_SELECTION);
    context = result.context;

    // Step 2: Select service
    result = transition(context, { text: "haircut" }, mockServices);
    expect(result.state).toBe(BookingFlowState.LEAD_NAME);
    context = result.context;

    // Step 3: Enter name
    result = transition(context, { text: "John Smith" }, mockServices);
    expect(result.state).toBe(BookingFlowState.LEAD_PHONE);
    context = result.context;

    // Step 4: Enter phone
    result = transition(context, { text: "123-456-7890" }, mockServices);
    expect(result.state).toBe(BookingFlowState.LEAD_EMAIL);
    context = result.context;

    // Step 5: Enter email
    result = transition(context, { text: "john@example.com" }, mockServices);
    expect(result.state).toBe(BookingFlowState.COMPLETE);
    expect(result.directive.type).toBe(ResponseDirectiveType.SHOW_BOOKING_LINK);
    expect(result.context.leadDraft).toEqual({
      name: "John Smith",
      phone: "1234567890",
      email: "john@example.com",
    });
  });
});
