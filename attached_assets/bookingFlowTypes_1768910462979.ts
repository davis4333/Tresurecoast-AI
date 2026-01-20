/**
 * Step 42: Booking Flow State Machine Types
 * Deterministic states and context for service booking flow
 */

/**
 * Booking flow states - MUST be deterministic
 * Flow: IDLE → SERVICE_SELECTION → LEAD_NAME → LEAD_PHONE → LEAD_EMAIL → COMPLETE
 */
export type BookingFlowState =
  | "IDLE"
  | "SERVICE_SELECTION"
  | "LEAD_NAME"
  | "LEAD_PHONE"
  | "LEAD_EMAIL"
  | "COMPLETE";

/**
 * Lead data collected during flow
 */
export interface LeadDraft {
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * Selected service context
 */
export interface SelectedService {
  id: string;
  name: string;
  bookingUrl?: string | null;
  paymentUrl?: string | null;
}

/**
 * Complete booking flow context stored in conversation
 */
export interface BookingFlowContext {
  state: BookingFlowState;
  selectedService?: SelectedService;
  leadDraft: LeadDraft;
  /** Timestamp when flow started */
  startedAt?: Date;
  /** Timestamp when flow completed */
  completedAt?: Date;
  /** Error messages for current step */
  errors?: string[];
}

/**
 * Response directive types - tells UI what to render
 */
export type ResponseDirectiveType =
  | "SHOW_SERVICE_PICKER"
  | "ASK_FOR_NAME"
  | "ASK_FOR_PHONE"
  | "ASK_FOR_EMAIL"
  | "SHOW_BOOKING_LINK"
  | "SHOW_ERROR"
  | "CONTINUE_CHAT";

/**
 * Structured response from state machine
 */
export interface ResponseDirective {
  type: ResponseDirectiveType;
  message: string;
  /** Available services for picker */
  services?: SelectedService[];
  /** Final booking/payment URL */
  bookingUrl?: string;
  /** Error details */
  error?: string;
}

/**
 * State machine transition result
 */
export interface TransitionResult {
  /** New state after transition */
  state: BookingFlowState;
  /** Updated context */
  context: BookingFlowContext;
  /** Response directive for UI */
  directive: ResponseDirective;
  /** Whether this transition requires persistence */
  shouldPersist: boolean;
}

/**
 * User input that drives transitions
 */
export interface UserInput {
  text: string;
  /** Optional: pre-selected service ID (from button click) */
  selectedServiceId?: string;
}

/**
 * Booking intent keywords (case-insensitive)
 */
export const BOOKING_INTENT_KEYWORDS = [
  "book",
  "appointment",
  "schedule",
  "reserve",
  "how much",
  "price",
  "cost",
  "services",
  "service",
  "availability",
  "available",
] as const;

/**
 * Cancel/reset keywords
 */
export const CANCEL_KEYWORDS = ["cancel", "stop", "quit", "nevermind"] as const;

/**
 * Restart keywords
 */
export const RESTART_KEYWORDS = ["restart", "start over", "reset"] as const;

/**
 * Back/previous keywords
 */
export const BACK_KEYWORDS = ["back", "previous", "go back"] as const;

/**
 * Data event types for booking flow tracking
 */
export const BOOKING_FLOW_EVENTS = {
  STARTED: "BOOKING_FLOW_STARTED",
  SERVICE_SELECTED: "SERVICE_SELECTED",
  LEAD_NAME_CAPTURED: "LEAD_NAME_CAPTURED",
  LEAD_PHONE_CAPTURED: "LEAD_PHONE_CAPTURED",
  LEAD_EMAIL_CAPTURED: "LEAD_EMAIL_CAPTURED",
  LEAD_CAPTURED_COMPLETE: "LEAD_CAPTURED",
  BOOKING_LINK_SHOWN: "BOOKING_LINK_SHOWN",
  FLOW_CANCELLED: "BOOKING_FLOW_CANCELLED",
  FLOW_RESTARTED: "BOOKING_FLOW_RESTARTED",
} as const;

export type BookingFlowEvent =
  (typeof BOOKING_FLOW_EVENTS)[keyof typeof BOOKING_FLOW_EVENTS];
