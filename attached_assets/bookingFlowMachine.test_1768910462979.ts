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
} from "../src/lib/booking/bookingFlowMachine";
import {
  validateName,
  validatePhone,
  validateEmail,
  looksLikeServiceSelection,
} from "../src/lib/booking/bookingFlowValidators";
import type { SelectedService, UserInput } from "../src/lib/booking/bookingFlowTypes";

// Mock services for testing
const mockServices: SelectedService[] = [
  {
    id: "svc_1",
    name: "Haircut",
    bookingUrl: "https://booking.example.com/haircut",
  },
  {
    id: "svc_2",
    name: "Beard Trim",
    paymentUrl: "https://pay.example.com/beard-trim",
  },
  {
    id: "svc_3",
    name: "Hot Towel Shave",
    // No booking URL - will test fallback
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

describe("Name Validation", () => {
  it("accepts valid names", () => {
    expect(validateName("John Smith").isValid).toBe(true);
    expect(validateName("Mary Jane").isValid).toBe(true);
    expect(validateName("O'Brien").isValid).toBe(true);
    expect(validateName("Jean-Luc").isValid).toBe(true);
    expect(validateName("J.K. Rowling").isValid).toBe(true);
  });

  it("rejects invalid names", () => {
    expect(validateName("").isValid).toBe(false);
    expect(validateName("A").isValid).toBe(false);
    expect(validateName("123").isValid).toBe(false);
    expect(validateName("@#$%").isValid).toBe(false);
    expect(validateName("John123").isValid).toBe(false);
  });

  it("trims whitespace", () => {
    const result = validateName("  John Smith  ");
    expect(result.isValid).toBe(true);
    expect(result.value).toBe("John Smith");
  });

  it("enforces length limits", () => {
    expect(validateName("A".repeat(100)).isValid).toBe(true);
    expect(validateName("A".repeat(101)).isValid).toBe(false);
  });
});

describe("Phone Validation", () => {
  it("accepts valid US phone numbers", () => {
    expect(validatePhone("1234567890").isValid).toBe(true);
    expect(validatePhone("(123) 456-7890").isValid).toBe(true);
    expect(validatePhone("123-456-7890").isValid).toBe(true);
    expect(validatePhone("123.456.7890").isValid).toBe(true);
  });

  it("accepts international phone numbers", () => {
    expect(validatePhone("+44 20 7946 0958").isValid).toBe(true);
    expect(validatePhone("+1 234 567 8900").isValid).toBe(true);
  });

  it("normalizes phone format", () => {
    const result = validatePhone("(123) 456-7890");
    expect(result.isValid).toBe(true);
    expect(result.value).toBe("1234567890");

    const intlResult = validatePhone("+1 234 567 8900");
    expect(intlResult.isValid).toBe(true);
    expect(intlResult.value).toBe("+12345678900");
  });

  it("rejects invalid phone numbers", () => {
    expect(validatePhone("").isValid).toBe(false);
    expect(validatePhone("123").isValid).toBe(false); // Too short
    expect(validatePhone("abc-def-ghij").isValid).toBe(false);
    expect(validatePhone("123456789012345678").isValid).toBe(false); // Too long
  });
});

describe("Email Validation", () => {
  it("accepts valid email addresses", () => {
    expect(validateEmail("john@example.com").isValid).toBe(true);
    expect(validateEmail("user+tag@domain.co.uk").isValid).toBe(true);
    expect(validateEmail("first.last@company.com").isValid).toBe(true);
  });

  it("rejects invalid email addresses", () => {
    expect(validateEmail("").isValid).toBe(false);
    expect(validateEmail("notanemail").isValid).toBe(false);
    expect(validateEmail("@example.com").isValid).toBe(false);
    expect(validateEmail("user@").isValid).toBe(false);
    expect(validateEmail("user@@example.com").isValid).toBe(false);
    expect(validateEmail("user@domain").isValid).toBe(false); // No TLD
  });

  it("normalizes email to lowercase", () => {
    const result = validateEmail("John.Smith@EXAMPLE.COM");
    expect(result.isValid).toBe(true);
    expect(result.value).toBe("john.smith@example.com");
  });

  it("enforces RFC length limit", () => {
    const longEmail = "a".repeat(250) + "@example.com";
    expect(validateEmail(longEmail).isValid).toBe(false);
  });
});

describe("Service Selection Detection", () => {
  it("detects numeric service IDs", () => {
    expect(looksLikeServiceSelection("123")).toBe(true);
    expect(looksLikeServiceSelection("1")).toBe(true);
  });

  it("detects short service names", () => {
    expect(looksLikeServiceSelection("haircut")).toBe(true);
    expect(looksLikeServiceSelection("beard trim")).toBe(true);
  });

  it("rejects long sentences", () => {
    expect(
      looksLikeServiceSelection(
        "I want to get a haircut and maybe a beard trim too"
      )
    ).toBe(false);
  });
});

describe("State Machine: IDLE → SERVICE_SELECTION", () => {
  it("transitions on booking intent when services exist", () => {
    const context = initBookingContext();
    const input: UserInput = { text: "I want to book an appointment" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("SERVICE_SELECTION");
    expect(result.directive.type).toBe("SHOW_SERVICE_PICKER");
    expect(result.directive.services).toEqual(mockServices);
    expect(result.shouldPersist).toBe(true);
  });

  it("stays IDLE if no booking intent", () => {
    const context = initBookingContext();
    const input: UserInput = { text: "hello" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("IDLE");
    expect(result.directive.type).toBe("CONTINUE_CHAT");
    expect(result.shouldPersist).toBe(false);
  });

  it("shows error if no services configured", () => {
    const context = initBookingContext();
    const input: UserInput = { text: "book appointment" };

    const result = transition(context, input, []);

    expect(result.state).toBe("IDLE");
    expect(result.directive.type).toBe("SHOW_ERROR");
    expect(result.directive.message).toContain("no services");
  });
});

describe("State Machine: SERVICE_SELECTION → LEAD_NAME", () => {
  const context = {
    state: "SERVICE_SELECTION" as const,
    leadDraft: {},
    errors: [],
  };

  it("transitions with explicit service ID", () => {
    const input: UserInput = {
      text: "haircut",
      selectedServiceId: "svc_1",
    };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_NAME");
    expect(result.context.selectedService?.id).toBe("svc_1");
    expect(result.directive.type).toBe("ASK_FOR_NAME");
    expect(result.shouldPersist).toBe(true);
  });

  it("transitions with service name match", () => {
    const input: UserInput = { text: "beard trim" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_NAME");
    expect(result.context.selectedService?.name).toBe("Beard Trim");
  });

  it("stays in SERVICE_SELECTION if invalid selection", () => {
    const input: UserInput = { text: "invalid service" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("SERVICE_SELECTION");
    expect(result.directive.type).toBe("SHOW_SERVICE_PICKER");
    expect(result.context.errors).toContain("Please select a valid service from the list.");
  });
});

describe("State Machine: LEAD_NAME → LEAD_PHONE", () => {
  const context = {
    state: "LEAD_NAME" as const,
    leadDraft: {},
    selectedService: mockServices[0],
    errors: [],
  };

  it("transitions with valid name", () => {
    const input: UserInput = { text: "John Smith" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_PHONE");
    expect(result.context.leadDraft.name).toBe("John Smith");
    expect(result.directive.type).toBe("ASK_FOR_PHONE");
    expect(result.shouldPersist).toBe(true);
  });

  it("stays in LEAD_NAME if invalid name", () => {
    const input: UserInput = { text: "A" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_NAME");
    expect(result.directive.type).toBe("ASK_FOR_NAME");
    expect(result.directive.error).toBeTruthy();
  });
});

describe("State Machine: LEAD_PHONE → LEAD_EMAIL", () => {
  const context = {
    state: "LEAD_PHONE" as const,
    leadDraft: { name: "John Smith" },
    selectedService: mockServices[0],
    errors: [],
  };

  it("transitions with valid phone", () => {
    const input: UserInput = { text: "(123) 456-7890" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_EMAIL");
    expect(result.context.leadDraft.phone).toBe("1234567890");
    expect(result.directive.type).toBe("ASK_FOR_EMAIL");
    expect(result.shouldPersist).toBe(true);
  });

  it("stays in LEAD_PHONE if invalid phone", () => {
    const input: UserInput = { text: "123" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_PHONE");
    expect(result.directive.error).toBeTruthy();
  });
});

describe("State Machine: LEAD_EMAIL → COMPLETE", () => {
  const context = {
    state: "LEAD_EMAIL" as const,
    leadDraft: { name: "John Smith", phone: "1234567890" },
    selectedService: mockServices[0],
    errors: [],
  };

  it("transitions with valid email and shows booking link", () => {
    const input: UserInput = { text: "john@example.com" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("COMPLETE");
    expect(result.context.leadDraft.email).toBe("john@example.com");
    expect(result.directive.type).toBe("SHOW_BOOKING_LINK");
    expect(result.directive.bookingUrl).toBe(mockServices[0].bookingUrl);
    expect(result.shouldPersist).toBe(true);
  });

  it("handles service with paymentUrl instead of bookingUrl", () => {
    const contextWithDifferentService = {
      ...context,
      selectedService: mockServices[1], // Has paymentUrl
    };
    const input: UserInput = { text: "john@example.com" };

    const result = transition(contextWithDifferentService, input, mockServices);

    expect(result.directive.bookingUrl).toBe(mockServices[1].paymentUrl);
  });

  it("handles service with no booking URL gracefully", () => {
    const contextWithNoUrl = {
      ...context,
      selectedService: mockServices[2], // No booking URL
    };
    const input: UserInput = { text: "john@example.com" };

    const result = transition(contextWithNoUrl, input, mockServices);

    expect(result.state).toBe("COMPLETE");
    expect(result.directive.type).toBe("SHOW_ERROR");
    expect(result.directive.message).toContain("contact you soon");
  });

  it("stays in LEAD_EMAIL if invalid email", () => {
    const input: UserInput = { text: "notanemail" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_EMAIL");
    expect(result.directive.error).toBeTruthy();
  });
});

describe("Global Commands: Cancel", () => {
  it("cancels from any state and resets to IDLE", () => {
    const states = [
      "SERVICE_SELECTION",
      "LEAD_NAME",
      "LEAD_PHONE",
      "LEAD_EMAIL",
    ] as const;

    states.forEach((state) => {
      const context = {
        state,
        leadDraft: { name: "John", phone: "123", email: "john@example.com" },
        selectedService: mockServices[0],
        errors: [],
      };
      const input: UserInput = { text: "cancel" };

      const result = transition(context, input, mockServices);

      expect(result.state).toBe("IDLE");
      expect(result.context.leadDraft).toEqual({});
      expect(result.directive.message).toContain("cancelled");
    });
  });
});

describe("Global Commands: Restart", () => {
  it("restarts from any state to SERVICE_SELECTION", () => {
    const context = {
      state: "LEAD_PHONE" as const,
      leadDraft: { name: "John", phone: "123" },
      selectedService: mockServices[0],
      errors: [],
    };
    const input: UserInput = { text: "restart" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("SERVICE_SELECTION");
    expect(result.context.leadDraft).toEqual({});
    expect(result.context.selectedService).toBeUndefined();
    expect(result.directive.type).toBe("SHOW_SERVICE_PICKER");
  });

  it("shows error if no services when restarting", () => {
    const context = {
      state: "LEAD_PHONE" as const,
      leadDraft: {},
      errors: [],
    };
    const input: UserInput = { text: "restart" };

    const result = transition(context, input, []);

    expect(result.state).toBe("IDLE");
    expect(result.directive.type).toBe("SHOW_ERROR");
  });
});

describe("Global Commands: Back", () => {
  it("goes back from LEAD_PHONE to LEAD_NAME", () => {
    const context = {
      state: "LEAD_PHONE" as const,
      leadDraft: { name: "John", phone: "1234567890" },
      selectedService: mockServices[0],
      errors: [],
    };
    const input: UserInput = { text: "back" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("LEAD_NAME");
    expect(result.context.leadDraft.phone).toBeUndefined();
    expect(result.context.leadDraft.name).toBeUndefined(); // Current field cleared
  });

  it("goes back from LEAD_NAME to SERVICE_SELECTION", () => {
    const context = {
      state: "LEAD_NAME" as const,
      leadDraft: { name: "John" },
      selectedService: mockServices[0],
      errors: [],
    };
    const input: UserInput = { text: "back" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("SERVICE_SELECTION");
    expect(result.context.selectedService).toBeUndefined();
  });

  it("goes back from SERVICE_SELECTION to IDLE (cancel)", () => {
    const context = {
      state: "SERVICE_SELECTION" as const,
      leadDraft: {},
      errors: [],
    };
    const input: UserInput = { text: "back" };

    const result = transition(context, input, mockServices);

    expect(result.state).toBe("IDLE");
  });
});

describe("Complete Flow: Happy Path", () => {
  it("completes full booking flow successfully", () => {
    let context = initBookingContext();

    // Step 1: Booking intent
    let result = transition(
      context,
      { text: "I want to book" },
      mockServices
    );
    expect(result.state).toBe("SERVICE_SELECTION");
    context = result.context;

    // Step 2: Select service
    result = transition(
      context,
      { text: "haircut", selectedServiceId: "svc_1" },
      mockServices
    );
    expect(result.state).toBe("LEAD_NAME");
    expect(result.context.selectedService?.name).toBe("Haircut");
    context = result.context;

    // Step 3: Enter name
    result = transition(context, { text: "John Smith" }, mockServices);
    expect(result.state).toBe("LEAD_PHONE");
    expect(result.context.leadDraft.name).toBe("John Smith");
    context = result.context;

    // Step 4: Enter phone
    result = transition(context, { text: "(123) 456-7890" }, mockServices);
    expect(result.state).toBe("LEAD_EMAIL");
    expect(result.context.leadDraft.phone).toBe("1234567890");
    context = result.context;

    // Step 5: Enter email
    result = transition(context, { text: "john@example.com" }, mockServices);
    expect(result.state).toBe("COMPLETE");
    expect(result.context.leadDraft.email).toBe("john@example.com");
    expect(result.directive.type).toBe("SHOW_BOOKING_LINK");
    expect(result.directive.bookingUrl).toBe(
      "https://booking.example.com/haircut"
    );

    // Verify complete lead data
    expect(result.context.leadDraft).toEqual({
      name: "John Smith",
      phone: "1234567890",
      email: "john@example.com",
    });
    expect(result.context.selectedService).toEqual(mockServices[0]);
  });
});
