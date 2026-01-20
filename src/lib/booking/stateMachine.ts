/**
 * @fileoverview Booking Flow State Machine
 * @module lib/booking/stateMachine
 * @version 1.0.0
 * 
 * Pure, deterministic state machine for booking flow.
 * NO AI HALLUCINATIONS - only links from OrganizationService records.
 * 
 * @author Treasure Coast AI Engineering Team
 * @license Proprietary
 * @copyright 2026 Treasure Coast AI. All rights reserved.
 */

import {
  BookingFlowState,
  ResponseDirectiveType,
  BOOKING_INTENT_KEYWORDS,
  CANCEL_KEYWORDS,
  RESTART_KEYWORDS,
  BACK_KEYWORDS,
  type BookingFlowContext,
  type LeadDraft,
  type ResponseDirective,
  type SelectedService,
  type TransitionResult,
  type UserInput,
  type ServiceId,
  type Url,
  type DataEvent,
  BookingFlowEventType,
  brand,
} from "./types";
import {
  validateName,
  validatePhone,
  validateEmail,
  looksLikeServiceSelection,
} from "./validators";

/**
 * Initialize a fresh booking flow context
 */
export function initBookingContext(): BookingFlowContext {
  return {
    state: BookingFlowState.IDLE,
    selectedService: null,
    leadDraft: {},
    startedAt: null,
    completedAt: null,
    errors: [],
    retryCount: 0,
    version: "1.0",
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
    BookingFlowState.IDLE,
    BookingFlowState.SERVICE_SELECTION,
    BookingFlowState.LEAD_NAME,
    BookingFlowState.LEAD_PHONE,
    BookingFlowState.LEAD_EMAIL,
    BookingFlowState.COMPLETE,
  ];

  const currentIndex = stateOrder.indexOf(currentState);
  if (currentIndex <= 0) return BookingFlowState.IDLE;

  return stateOrder[currentIndex - 1] as BookingFlowState;
}

/**
 * Clear lead draft data for a specific state
 */
function clearLeadDraftField(
  draft: LeadDraft,
  state: BookingFlowState
): LeadDraft {
  switch (state) {
    case BookingFlowState.LEAD_NAME:
      return { ...draft, name: undefined };
    case BookingFlowState.LEAD_PHONE:
      return { ...draft, phone: undefined };
    case BookingFlowState.LEAD_EMAIL:
      return { ...draft, email: undefined };
    default:
      return draft;
  }
}

/**
 * Handle cancel command - reset to IDLE
 */
function handleCancel(): TransitionResult {
  return {
    state: BookingFlowState.IDLE,
    context: initBookingContext(),
    directive: {
      type: ResponseDirectiveType.CONTINUE_CHAT,
      message: "No problem! Let me know if you'd like to book something later.",
    },
    shouldPersist: true,
    eventsToLog: [{
      eventType: BookingFlowEventType.FLOW_CANCELLED,
      timestamp: new Date().toISOString(),
      metadata: {},
    }],
  };
}

/**
 * Handle restart command - back to SERVICE_SELECTION
 */
function handleRestart(availableServices: SelectedService[]): TransitionResult {
  if (availableServices.length === 0) {
    return {
      state: BookingFlowState.IDLE,
      context: initBookingContext(),
      directive: {
        type: ResponseDirectiveType.SHOW_ERROR,
        message: "I'd love to help you book, but no services are currently configured. Please contact the business directly.",
        error: "No services configured",
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  return {
    state: BookingFlowState.SERVICE_SELECTION,
    context: {
      state: BookingFlowState.SERVICE_SELECTION,
      selectedService: null,
      leadDraft: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
      retryCount: 0,
      version: "1.0",
    },
    directive: {
      type: ResponseDirectiveType.SHOW_SERVICE_PICKER,
      message: "Let's start over! What service are you interested in?",
      services: availableServices,
    },
    shouldPersist: true,
    eventsToLog: [{
      eventType: BookingFlowEventType.FLOW_RESTARTED,
      timestamp: new Date().toISOString(),
      metadata: {},
    }],
  };
}

/**
 * Handle back command - go to previous step
 */
function handleBack(
  currentContext: BookingFlowContext,
  availableServices: SelectedService[]
): TransitionResult {
  const prevState = getPreviousState(currentContext.state);
  const clearedDraft = clearLeadDraftField(currentContext.leadDraft, currentContext.state);

  // If going back to IDLE, just reset
  if (prevState === BookingFlowState.IDLE) {
    return handleCancel();
  }

  // Build appropriate directive for previous state
  let directive: ResponseDirective;
  switch (prevState) {
    case BookingFlowState.SERVICE_SELECTION:
      directive = {
        type: ResponseDirectiveType.SHOW_SERVICE_PICKER,
        message: "Going back. What service would you like?",
        services: availableServices,
      };
      break;
    case BookingFlowState.LEAD_NAME:
      directive = {
        type: ResponseDirectiveType.ASK_FOR_NAME,
        message: "Going back. What's your name?",
      };
      break;
    case BookingFlowState.LEAD_PHONE:
      directive = {
        type: ResponseDirectiveType.ASK_FOR_PHONE,
        message: "Going back. What's your phone number?",
      };
      break;
    case BookingFlowState.LEAD_EMAIL:
      directive = {
        type: ResponseDirectiveType.ASK_FOR_EMAIL,
        message: "Going back. What's your email address?",
      };
      break;
    default:
      directive = {
        type: ResponseDirectiveType.CONTINUE_CHAT,
        message: "Going back.",
      };
  }

  return {
    state: prevState,
    context: {
      ...currentContext,
      state: prevState,
      leadDraft: clearedDraft,
      selectedService: prevState === BookingFlowState.SERVICE_SELECTION ? null : currentContext.selectedService,
      errors: [],
      retryCount: 0,
    },
    directive,
    shouldPersist: true,
    eventsToLog: [],
  };
}

/**
 * Handle IDLE state - detect booking intent
 */
function handleIdle(
  input: UserInput,
  availableServices: SelectedService[]
): TransitionResult {
  if (!isBookingIntent(input.text)) {
    return {
      state: BookingFlowState.IDLE,
      context: initBookingContext(),
      directive: {
        type: ResponseDirectiveType.CONTINUE_CHAT,
        message: "",
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  if (availableServices.length === 0) {
    return {
      state: BookingFlowState.IDLE,
      context: initBookingContext(),
      directive: {
        type: ResponseDirectiveType.SHOW_ERROR,
        message: "I'd love to help you book, but no services are currently configured. Please contact the business directly.",
        error: "No services configured",
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  return {
    state: BookingFlowState.SERVICE_SELECTION,
    context: {
      state: BookingFlowState.SERVICE_SELECTION,
      selectedService: null,
      leadDraft: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
      retryCount: 0,
      version: "1.0",
    },
    directive: {
      type: ResponseDirectiveType.SHOW_SERVICE_PICKER,
      message: "Great! What service are you interested in?",
      services: availableServices,
    },
    shouldPersist: true,
    eventsToLog: [{
      eventType: BookingFlowEventType.FLOW_STARTED,
      timestamp: new Date().toISOString(),
      metadata: {},
    }],
  };
}

/**
 * Handle SERVICE_SELECTION state - match service
 */
function handleServiceSelection(
  input: UserInput,
  availableServices: SelectedService[],
  currentContext: BookingFlowContext
): TransitionResult {
  let matchedService: SelectedService | undefined;

  // Try selectedServiceId first (from button click)
  if (input.selectedServiceId) {
    matchedService = availableServices.find(
      (s) => s.id === input.selectedServiceId
    );
  }

  // If no button click, try to match by text
  if (!matchedService && looksLikeServiceSelection(input.text)) {
    const normalized = input.text.toLowerCase().trim();

    // Try exact ID match
    matchedService = availableServices.find((s) => s.id === normalized);

    // Try name match (fuzzy)
    if (!matchedService) {
      matchedService = availableServices.find((s) =>
        s.name.toLowerCase().includes(normalized) ||
        normalized.includes(s.name.toLowerCase())
      );
    }
  }

  if (!matchedService) {
    return {
      state: BookingFlowState.SERVICE_SELECTION,
      context: {
        ...currentContext,
        errors: [{
          message: "Please select a valid service from the list.",
          code: "INVALID_SERVICE_SELECTION",
          field: "service",
        }],
        retryCount: currentContext.retryCount + 1,
      },
      directive: {
        type: ResponseDirectiveType.SHOW_SERVICE_PICKER,
        message: "I didn't catch that. Please choose one of these services:",
        services: availableServices,
        error: "Invalid service selection",
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  return {
    state: BookingFlowState.LEAD_NAME,
    context: {
      ...currentContext,
      state: BookingFlowState.LEAD_NAME,
      selectedService: matchedService,
      errors: [],
      retryCount: 0,
    },
    directive: {
      type: ResponseDirectiveType.ASK_FOR_NAME,
      message: `Perfect! I've got you down for ${matchedService.name}. What's your name?`,
    },
    shouldPersist: true,
    eventsToLog: [{
      eventType: BookingFlowEventType.SERVICE_SELECTED,
      timestamp: new Date().toISOString(),
      metadata: {
        serviceId: matchedService.id,
        serviceName: matchedService.name,
      },
    }],
  };
}

/**
 * Handle LEAD_NAME state - validate name
 */
function handleLeadName(
  input: UserInput,
  currentContext: BookingFlowContext
): TransitionResult {
  const validation = validateName(input.text);

  if (!validation.isValid) {
    return {
      state: BookingFlowState.LEAD_NAME,
      context: {
        ...currentContext,
        errors: validation.error ? [validation.error] : [],
        retryCount: currentContext.retryCount + 1,
      },
      directive: {
        type: ResponseDirectiveType.ASK_FOR_NAME,
        message: validation.error?.message || "Please enter a valid name.",
        error: validation.error?.message,
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  return {
    state: BookingFlowState.LEAD_PHONE,
    context: {
      ...currentContext,
      state: BookingFlowState.LEAD_PHONE,
      leadDraft: {
        ...currentContext.leadDraft,
        name: validation.value,
      },
      errors: [],
      retryCount: 0,
    },
    directive: {
      type: ResponseDirectiveType.ASK_FOR_PHONE,
      message: `Thanks, ${validation.value}! What's the best phone number to reach you?`,
    },
    shouldPersist: true,
    eventsToLog: [{
      eventType: BookingFlowEventType.NAME_CAPTURED,
      timestamp: new Date().toISOString(),
      metadata: {},
    }],
  };
}

/**
 * Handle LEAD_PHONE state - validate phone
 */
function handleLeadPhone(
  input: UserInput,
  currentContext: BookingFlowContext
): TransitionResult {
  const validation = validatePhone(input.text);

  if (!validation.isValid) {
    return {
      state: BookingFlowState.LEAD_PHONE,
      context: {
        ...currentContext,
        errors: validation.error ? [validation.error] : [],
        retryCount: currentContext.retryCount + 1,
      },
      directive: {
        type: ResponseDirectiveType.ASK_FOR_PHONE,
        message: validation.error?.message || "Please enter a valid phone number.",
        error: validation.error?.message,
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  return {
    state: BookingFlowState.LEAD_EMAIL,
    context: {
      ...currentContext,
      state: BookingFlowState.LEAD_EMAIL,
      leadDraft: {
        ...currentContext.leadDraft,
        phone: validation.value,
      },
      errors: [],
      retryCount: 0,
    },
    directive: {
      type: ResponseDirectiveType.ASK_FOR_EMAIL,
      message: "Great! And what's your email address?",
    },
    shouldPersist: true,
    eventsToLog: [{
      eventType: BookingFlowEventType.PHONE_CAPTURED,
      timestamp: new Date().toISOString(),
      metadata: {},
    }],
  };
}

/**
 * Handle LEAD_EMAIL state - validate email, complete flow
 */
function handleLeadEmail(
  input: UserInput,
  currentContext: BookingFlowContext
): TransitionResult {
  const validation = validateEmail(input.text);

  if (!validation.isValid) {
    return {
      state: BookingFlowState.LEAD_EMAIL,
      context: {
        ...currentContext,
        errors: validation.error ? [validation.error] : [],
        retryCount: currentContext.retryCount + 1,
      },
      directive: {
        type: ResponseDirectiveType.ASK_FOR_EMAIL,
        message: validation.error?.message || "Please enter a valid email address.",
        error: validation.error?.message,
      },
      shouldPersist: false,
      eventsToLog: [],
    };
  }

  const { selectedService } = currentContext;

  if (!selectedService) {
    return {
      state: BookingFlowState.IDLE,
      context: initBookingContext(),
      directive: {
        type: ResponseDirectiveType.SHOW_ERROR,
        message: "Something went wrong. Let's start over.",
        error: "No service selected",
      },
      shouldPersist: true,
      eventsToLog: [],
    };
  }

  // Extract booking URL (deterministic - from DB only!)
  const bookingUrl = selectedService.bookingUrl || selectedService.paymentUrl;
  const completedAt = new Date().toISOString();

  const completedContext: BookingFlowContext = {
    ...currentContext,
    state: BookingFlowState.COMPLETE,
    leadDraft: {
      ...currentContext.leadDraft,
      email: validation.value,
    },
    completedAt,
    errors: [],
    retryCount: 0,
  };

  const events: DataEvent[] = [
    {
      eventType: BookingFlowEventType.EMAIL_CAPTURED,
      timestamp: completedAt,
      metadata: {},
    },
    {
      eventType: BookingFlowEventType.LEAD_CREATED,
      timestamp: completedAt,
      metadata: {
        serviceName: selectedService.name,
        serviceId: selectedService.id,
      },
    },
  ];

  if (!bookingUrl) {
    return {
      state: BookingFlowState.COMPLETE,
      context: completedContext,
      directive: {
        type: ResponseDirectiveType.SHOW_ERROR,
        message: `Thanks, ${currentContext.leadDraft.name}! I've saved your information. Someone from the business will contact you soon at ${validation.value} to complete your ${selectedService.name} booking.`,
        error: "No booking URL configured",
      },
      shouldPersist: true,
      eventsToLog: events,
    };
  }

  events.push({
    eventType: BookingFlowEventType.BOOKING_LINK_SHOWN,
    timestamp: completedAt,
    metadata: { bookingUrl },
  });

  return {
    state: BookingFlowState.COMPLETE,
    context: completedContext,
    directive: {
      type: ResponseDirectiveType.SHOW_BOOKING_LINK,
      message: `Perfect! Here's your booking link for ${selectedService.name}:`,
      bookingUrl: bookingUrl as Url,
    },
    shouldPersist: true,
    eventsToLog: events,
  };
}

/**
 * Handle COMPLETE state - reset for next booking
 */
function handleComplete(currentContext: BookingFlowContext): TransitionResult {
  return {
    state: BookingFlowState.IDLE,
    context: initBookingContext(),
    directive: {
      type: ResponseDirectiveType.CONTINUE_CHAT,
      message: "Is there anything else I can help you with?",
    },
    shouldPersist: true,
    eventsToLog: [],
  };
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
  switch (currentContext.state) {
    case BookingFlowState.IDLE:
      return handleIdle(input, availableServices);

    case BookingFlowState.SERVICE_SELECTION:
      return handleServiceSelection(input, availableServices, currentContext);

    case BookingFlowState.LEAD_NAME:
      return handleLeadName(input, currentContext);

    case BookingFlowState.LEAD_PHONE:
      return handleLeadPhone(input, currentContext);

    case BookingFlowState.LEAD_EMAIL:
      return handleLeadEmail(input, currentContext);

    case BookingFlowState.COMPLETE:
      return handleComplete(currentContext);

    default:
      return {
        state: BookingFlowState.IDLE,
        context: initBookingContext(),
        directive: {
          type: ResponseDirectiveType.SHOW_ERROR,
          message: "Something went wrong. Let's start over.",
          error: `Unknown state: ${currentContext.state}`,
        },
        shouldPersist: true,
        eventsToLog: [],
      };
  }
}
