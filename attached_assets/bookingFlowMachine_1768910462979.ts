/**
 * Step 42: Booking Flow State Machine
 * Pure, deterministic state machine for booking flow
 * NO AI HALLUCINATIONS - only links from OrganizationService records
 */

import type {
  BookingFlowContext,
  BookingFlowState,
  LeadDraft,
  ResponseDirective,
  SelectedService,
  TransitionResult,
  UserInput,
} from "./bookingFlowTypes";
import {
  BOOKING_INTENT_KEYWORDS,
  CANCEL_KEYWORDS,
  RESTART_KEYWORDS,
  BACK_KEYWORDS,
} from "./bookingFlowTypes";
import {
  validateName,
  validatePhone,
  validateEmail,
  looksLikeServiceSelection,
} from "./bookingFlowValidators";

/**
 * Initialize a fresh booking flow context
 */
export function initBookingContext(): BookingFlowContext {
  return {
    state: "IDLE",
    leadDraft: {},
    errors: [],
  };
}

/**
 * Check if user input contains booking intent keywords
 */
export function isBookingIntent(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  return BOOKING_INTENT_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
}

/**
 * Check if user wants to cancel/stop the flow
 */
export function isCancel(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  return CANCEL_KEYWORDS.some((keyword) =>
    normalized === keyword || normalized.includes(keyword)
  );
}

/**
 * Check if user wants to restart the flow
 */
export function isRestart(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  return RESTART_KEYWORDS.some((keyword) =>
    normalized === keyword || normalized.includes(keyword)
  );
}

/**
 * Check if user wants to go back to previous step
 */
export function isBack(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  
  return BACK_KEYWORDS.some((keyword) =>
    normalized === keyword || normalized.includes(keyword)
  );
}

/**
 * Get previous state for "back" navigation
 */
function getPreviousState(currentState: BookingFlowState): BookingFlowState {
  const stateOrder: BookingFlowState[] = [
    "IDLE",
    "SERVICE_SELECTION",
    "LEAD_NAME",
    "LEAD_PHONE",
    "LEAD_EMAIL",
    "COMPLETE",
  ];

  const currentIndex = stateOrder.indexOf(currentState);
  if (currentIndex <= 0) return "IDLE";
  
  return stateOrder[currentIndex - 1];
}

/**
 * Clear lead draft data for a specific field or all fields
 */
function clearLeadDraftField(
  draft: LeadDraft,
  state: BookingFlowState
): LeadDraft {
  switch (state) {
    case "LEAD_NAME":
      return { ...draft, name: undefined };
    case "LEAD_PHONE":
      return { ...draft, phone: undefined };
    case "LEAD_EMAIL":
      return { ...draft, email: undefined };
    default:
      return draft;
  }
}

/**
 * Main state machine transition function
 * PURE FUNCTION - no side effects, no DB calls
 * 
 * @param currentContext - Current booking flow context
 * @param input - User input (text + optional selectedServiceId)
 * @param availableServices - Services from OrganizationService table
 * @returns TransitionResult with new state, context, and UI directive
 */
export function transition(
  currentContext: BookingFlowContext,
  input: UserInput,
  availableServices: SelectedService[]
): TransitionResult {
  const { state: currentState, leadDraft, selectedService } = currentContext;

  // Global commands: cancel, restart, back
  if (isCancel(input.text)) {
    return handleCancel();
  }

  if (isRestart(input.text)) {
    return handleRestart(availableServices);
  }

  if (isBack(input.text)) {
    return handleBack(currentContext, availableServices);
  }

  // State-specific transitions
  switch (currentState) {
    case "IDLE":
      return handleIdle(input, availableServices);

    case "SERVICE_SELECTION":
      return handleServiceSelection(
        input,
        availableServices,
        currentContext
      );

    case "LEAD_NAME":
      return handleLeadName(input, currentContext);

    case "LEAD_PHONE":
      return handleLeadPhone(input, currentContext);

    case "LEAD_EMAIL":
      return handleLeadEmail(input, currentContext);

    case "COMPLETE":
      return handleComplete(currentContext);

    default:
      // Should never happen, but TypeScript exhaustiveness check
      return {
        state: "IDLE",
        context: initBookingContext(),
        directive: {
          type: "SHOW_ERROR",
          message: "Something went wrong. Let's start over.",
          error: `Unknown state: ${currentState}`,
        },
        shouldPersist: true,
      };
  }
}

/**
 * Handle IDLE state
 * Transition: booking intent → SERVICE_SELECTION
 */
function handleIdle(
  input: UserInput,
  availableServices: SelectedService[]
): TransitionResult {
  if (!isBookingIntent(input.text)) {
    // Stay in IDLE, continue normal chat
    return {
      state: "IDLE",
      context: initBookingContext(),
      directive: {
        type: "CONTINUE_CHAT",
        message: "", // Will be handled by normal chat flow
      },
      shouldPersist: false,
    };
  }

  // Booking intent detected!
  if (availableServices.length === 0) {
    return {
      state: "IDLE",
      context: initBookingContext(),
      directive: {
        type: "SHOW_ERROR",
        message:
          "I'd love to help you book, but no services are currently configured. Please contact the business directly.",
        error: "No services configured",
      },
      shouldPersist: false,
    };
  }

  // Move to service selection
  return {
    state: "SERVICE_SELECTION",
    context: {
      state: "SERVICE_SELECTION",
      leadDraft: {},
      startedAt: new Date(),
      errors: [],
    },
    directive: {
      type: "SHOW_SERVICE_PICKER",
      message: "Great! What service are you interested in?",
      services: availableServices,
    },
    shouldPersist: true,
  };
}

/**
 * Handle SERVICE_SELECTION state
 * Transition: service selected → LEAD_NAME
 */
function handleServiceSelection(
  input: UserInput,
  availableServices: SelectedService[],
  currentContext: BookingFlowContext
): TransitionResult {
  let selectedService: SelectedService | undefined;

  // Try selectedServiceId first (from button click)
  if (input.selectedServiceId) {
    selectedService = availableServices.find(
      (s) => s.id === input.selectedServiceId
    );
  }

  // If no button click, try to match by text
  if (!selectedService && looksLikeServiceSelection(input.text)) {
    const normalized = input.text.toLowerCase().trim();
    
    // Try exact ID match
    selectedService = availableServices.find((s) => s.id === normalized);
    
    // Try name match (fuzzy)
    if (!selectedService) {
      selectedService = availableServices.find((s) =>
        s.name.toLowerCase().includes(normalized) ||
        normalized.includes(s.name.toLowerCase())
      );
    }
  }

  if (!selectedService) {
    return {
      state: "SERVICE_SELECTION",
      context: {
        ...currentContext,
        errors: ["Please select a valid service from the list."],
      },
      directive: {
        type: "SHOW_SERVICE_PICKER",
        message: "I didn't catch that. Please choose one of these services:",
        services: availableServices,
        error: "Invalid service selection",
      },
      shouldPersist: false,
    };
  }

  // Service selected! Move to name capture
  return {
    state: "LEAD_NAME",
    context: {
      ...currentContext,
      state: "LEAD_NAME",
      selectedService,
      errors: [],
    },
    directive: {
      type: "ASK_FOR_NAME",
      message: `Perfect! I've got you down for ${selectedService.name}. What's your name?`,
    },
    shouldPersist: true,
  };
}

/**
 * Handle LEAD_NAME state
 * Transition: valid name → LEAD_PHONE
 */
function handleLeadName(
  input: UserInput,
  currentContext: BookingFlowContext
): TransitionResult {
  const validation = validateName(input.text);

  if (!validation.isValid) {
    return {
      state: "LEAD_NAME",
      context: {
        ...currentContext,
        errors: [validation.error || "Invalid name"],
      },
      directive: {
        type: "ASK_FOR_NAME",
        message: validation.error || "Please enter a valid name.",
        error: validation.error,
      },
      shouldPersist: false,
    };
  }

  return {
    state: "LEAD_PHONE",
    context: {
      ...currentContext,
      state: "LEAD_PHONE",
      leadDraft: {
        ...currentContext.leadDraft,
        name: validation.value,
      },
      errors: [],
    },
    directive: {
      type: "ASK_FOR_PHONE",
      message: `Thanks, ${validation.value}! What's the best phone number to reach you?`,
    },
    shouldPersist: true,
  };
}

/**
 * Handle LEAD_PHONE state
 * Transition: valid phone → LEAD_EMAIL
 */
function handleLeadPhone(
  input: UserInput,
  currentContext: BookingFlowContext
): TransitionResult {
  const validation = validatePhone(input.text);

  if (!validation.isValid) {
    return {
      state: "LEAD_PHONE",
      context: {
        ...currentContext,
        errors: [validation.error || "Invalid phone number"],
      },
      directive: {
        type: "ASK_FOR_PHONE",
        message: validation.error || "Please enter a valid phone number.",
        error: validation.error,
      },
      shouldPersist: false,
    };
  }

  return {
    state: "LEAD_EMAIL",
    context: {
      ...currentContext,
      state: "LEAD_EMAIL",
      leadDraft: {
        ...currentContext.leadDraft,
        phone: validation.value,
      },
      errors: [],
    },
    directive: {
      type: "ASK_FOR_EMAIL",
      message: "Great! And what's your email address?",
    },
    shouldPersist: true,
  };
}

/**
 * Handle LEAD_EMAIL state
 * Transition: valid email → COMPLETE
 */
function handleLeadEmail(
  input: UserInput,
  currentContext: BookingFlowContext
): TransitionResult {
  const validation = validateEmail(input.text);

  if (!validation.isValid) {
    return {
      state: "LEAD_EMAIL",
      context: {
        ...currentContext,
        errors: [validation.error || "Invalid email address"],
      },
      directive: {
        type: "ASK_FOR_EMAIL",
        message: validation.error || "Please enter a valid email address.",
        error: validation.error,
      },
      shouldPersist: false,
    };
  }

  const { selectedService } = currentContext;

  if (!selectedService) {
    // Should never happen, but safety check
    return {
      state: "IDLE",
      context: initBookingContext(),
      directive: {
        type: "SHOW_ERROR",
        message: "Something went wrong. Let's start over.",
        error: "No service selected",
      },
      shouldPersist: true,
    };
  }

  // Extract booking URL (deterministic - from DB only!)
  const bookingUrl = selectedService.bookingUrl || selectedService.paymentUrl;

  if (!bookingUrl) {
    // No booking URL configured for this service
    return {
      state: "COMPLETE",
      context: {
        ...currentContext,
        state: "COMPLETE",
        leadDraft: {
          ...currentContext.leadDraft,
          email: validation.value,
        },
        completedAt: new Date(),
        errors: [],
      },
      directive: {
        type: "SHOW_ERROR",
        message: `Thanks, ${currentContext.leadDraft.name}! I've saved your information. Someone from the business will contact you soon at ${validation.value} to complete your ${selectedService.name} booking.`,
        error: "No booking URL configured",
      },
      shouldPersist: true,
    };
  }

  return {
    state: "COMPLETE",
    context: {
      ...currentContext,
      state: "COMPLETE",
      leadDraft: {
        ...currentContext.leadDraft,
        email: validation.value,
      },
      completedAt: new Date(),
      errors: [],
    },
    directive: {
      type: "SHOW_BOOKING_LINK",
      message: `Perfect! Here's your booking link for ${selectedService.name}:`,
      bookingUrl,
    },
    shouldPersist: true,
  };
}

/**
 * Handle COMPLETE state
 * User is done, reset to IDLE for next booking
 */
function handleComplete(
  currentContext: BookingFlowContext
): TransitionResult {
  return {
    state: "IDLE",
    context: initBookingContext(),
    directive: {
      type: "CONTINUE_CHAT",
      message: "Is there anything else I can help you with?",
    },
    shouldPersist: true,
  };
}

/**
 * Handle cancel command (global)
 */
function handleCancel(): TransitionResult {
  return {
    state: "IDLE",
    context: initBookingContext(),
    directive: {
      type: "CONTINUE_CHAT",
      message: "No problem! Booking cancelled. Let me know if you need anything else.",
    },
    shouldPersist: true,
  };
}

/**
 * Handle restart command (global)
 */
function handleRestart(
  availableServices: SelectedService[]
): TransitionResult {
  if (availableServices.length === 0) {
    return {
      state: "IDLE",
      context: initBookingContext(),
      directive: {
        type: "SHOW_ERROR",
        message: "No services are currently configured. Please contact the business.",
        error: "No services configured",
      },
      shouldPersist: true,
    };
  }

  return {
    state: "SERVICE_SELECTION",
    context: {
      state: "SERVICE_SELECTION",
      leadDraft: {},
      startedAt: new Date(),
      errors: [],
    },
    directive: {
      type: "SHOW_SERVICE_PICKER",
      message: "Let's start fresh! What service are you interested in?",
      services: availableServices,
    },
    shouldPersist: true,
  };
}

/**
 * Handle back command (global, but state-aware)
 */
function handleBack(
  currentContext: BookingFlowContext,
  availableServices: SelectedService[]
): TransitionResult {
  const previousState = getPreviousState(currentContext.state);

  // Clear the field data for current state when going back
  const updatedDraft = clearLeadDraftField(
    currentContext.leadDraft,
    currentContext.state
  );

  switch (previousState) {
    case "IDLE":
      return handleCancel();

    case "SERVICE_SELECTION":
      return {
        state: "SERVICE_SELECTION",
        context: {
          ...currentContext,
          state: "SERVICE_SELECTION",
          leadDraft: updatedDraft,
          selectedService: undefined,
          errors: [],
        },
        directive: {
          type: "SHOW_SERVICE_PICKER",
          message: "Sure, let's pick a different service. What would you like?",
          services: availableServices,
        },
        shouldPersist: true,
      };

    case "LEAD_NAME":
      return {
        state: "LEAD_NAME",
        context: {
          ...currentContext,
          state: "LEAD_NAME",
          leadDraft: updatedDraft,
          errors: [],
        },
        directive: {
          type: "ASK_FOR_NAME",
          message: "What's your name?",
        },
        shouldPersist: true,
      };

    case "LEAD_PHONE":
      return {
        state: "LEAD_PHONE",
        context: {
          ...currentContext,
          state: "LEAD_PHONE",
          leadDraft: updatedDraft,
          errors: [],
        },
        directive: {
          type: "ASK_FOR_PHONE",
          message: "What's the best phone number to reach you?",
        },
        shouldPersist: true,
      };

    default:
      return handleCancel();
  }
}
