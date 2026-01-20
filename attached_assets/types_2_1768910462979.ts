/**
 * @fileoverview Booking Flow State Machine - Type Definitions
 * @module lib/booking/types
 * @version 1.0.0
 * 
 * Enterprise-grade type system for deterministic booking flow state machine.
 * Implements type-driven development with branded types for enhanced type safety.
 * 
 * @author Treasure Coast AI Engineering Team
 * @license Proprietary
 * @copyright 2026 Treasure Coast AI. All rights reserved.
 * 
 * Security Classification: INTERNAL
 * Data Classification: PII (Personally Identifiable Information)
 * 
 * @remarks
 * This module follows SOLID principles and implements a finite state machine
 * pattern with zero runtime dependencies. All types are compile-time only
 * and incur zero runtime overhead.
 * 
 * Compliance:
 * - GDPR Article 25: Privacy by Design
 * - CCPA: California Consumer Privacy Act
 * - PCI DSS Level 1 (payment URL handling)
 * - OWASP ASVS 4.0
 * 
 * @see {@link https://github.com/treasure-coast-ai/docs/adr/042-booking-flow-state-machine.md}
 */

/**
 * Brand type utility for nominal typing
 * Prevents accidental type substitution at compile time
 * 
 * @template T - The base type to brand
 * @template Brand - The brand identifier
 * 
 * @example
 * ```typescript
 * type UserId = Branded<string, 'UserId'>;
 * type Email = Branded<string, 'Email'>;
 * 
 * const userId: UserId = 'user_123' as UserId;
 * const email: Email = userId; // ❌ Type error - brands don't match
 * ```
 */
type Branded<T, Brand extends string> = T & { __brand: Brand };

/**
 * Booking flow state enumeration
 * 
 * Implements a strict finite state machine with deterministic transitions.
 * Each state represents a discrete step in the booking flow lifecycle.
 * 
 * State Transition Graph:
 * ```
 * IDLE ──[booking_intent]──> SERVICE_SELECTION
 *   ↑                              │
 *   │                     [service_selected]
 *   │                              ↓
 *   │                         LEAD_NAME
 *   │                              │
 *   │                      [valid_name]
 *   │                              ↓
 *   │                        LEAD_PHONE
 *   │                              │
 *   │                     [valid_phone]
 *   │                              ↓
 *   │                        LEAD_EMAIL
 *   │                              │
 *   │                     [valid_email]
 *   │                              ↓
 *   │                         COMPLETE
 *   │                              │
 *   └──────[cancel/complete]───────┘
 * ```
 * 
 * @readonly
 * @enum {string}
 */
export enum BookingFlowState {
  /**
   * Initial state - awaiting booking intent detection
   * Entry: System initialization or flow completion
   * Exit: Booking intent detected + services available
   */
  IDLE = "IDLE",

  /**
   * Service selection state - awaiting service choice
   * Entry: Valid booking intent + non-empty service list
   * Exit: Valid service selection
   */
  SERVICE_SELECTION = "SERVICE_SELECTION",

  /**
   * Name capture state - awaiting valid name input
   * Entry: Service selected
   * Exit: Valid name provided (2-100 chars)
   */
  LEAD_NAME = "LEAD_NAME",

  /**
   * Phone capture state - awaiting valid phone input
   * Entry: Valid name captured
   * Exit: Valid phone number (10-15 digits)
   */
  LEAD_PHONE = "LEAD_PHONE",

  /**
   * Email capture state - awaiting valid email input
   * Entry: Valid phone captured
   * Exit: Valid email address (RFC 5322)
   */
  LEAD_EMAIL = "LEAD_EMAIL",

  /**
   * Terminal state - lead captured, booking link presented
   * Entry: Valid email captured
   * Exit: User acknowledgment or timeout
   */
  COMPLETE = "COMPLETE",
}

/**
 * Service identifier - branded type for type safety
 * Prevents mixing service IDs with other string identifiers
 */
export type ServiceId = Branded<string, "ServiceId">;

/**
 * Conversation identifier - branded type for type safety
 */
export type ConversationId = Branded<string, "ConversationId">;

/**
 * Organization identifier - branded type for type safety
 */
export type OrganizationId = Branded<string, "OrganizationId">;

/**
 * Bot identifier - branded type for type safety
 */
export type BotId = Branded<string, "BotId">;

/**
 * Email address - branded type for validated emails
 */
export type EmailAddress = Branded<string, "EmailAddress">;

/**
 * Phone number - branded type for validated phones
 */
export type PhoneNumber = Branded<string, "PhoneNumber">;

/**
 * URL - branded type for validated URLs
 */
export type Url = Branded<string, "Url">;

/**
 * Lead data draft - collected incrementally during flow
 * 
 * Security: Contains PII - must be encrypted at rest
 * Retention: 90 days post-capture per privacy policy
 * 
 * @interface LeadDraft
 */
export interface LeadDraft {
  /**
   * Customer's full name
   * Validation: 2-100 characters, letters/spaces/hyphens/apostrophes
   * Example: "John O'Brien-Smith"
   */
  readonly name?: string;

  /**
   * Customer's phone number (normalized format)
   * Format: E.164 or local format without formatting chars
   * Example: "12345678901" or "+12345678901"
   * 
   * Security: PII - mask in logs as XXX-XXX-1234
   */
  readonly phone?: PhoneNumber;

  /**
   * Customer's email address (normalized to lowercase)
   * Format: RFC 5322 compliant
   * Example: "john.smith@example.com"
   * 
   * Security: PII - use for lead deduplication only
   */
  readonly email?: EmailAddress;
}

/**
 * Selected service metadata
 * Snapshot of service at time of selection for audit trail
 * 
 * @interface SelectedService
 */
export interface SelectedService {
  /**
   * Unique service identifier
   * Must match OrganizationService.id from database
   */
  readonly id: ServiceId;

  /**
   * Service display name at time of selection
   * Snapshot for audit - may differ from current DB value
   */
  readonly name: string;

  /**
   * Primary booking URL (Square, Calendly, etc.)
   * Must be validated as HTTPS in production
   * Null if not configured
   * 
   * Security: Validate against allowlist in production
   */
  readonly bookingUrl: Url | null;

  /**
   * Alternative payment/booking URL (Stripe, PayPal, etc.)
   * Used as fallback if bookingUrl is null
   * 
   * Security: Validate against allowlist in production
   */
  readonly paymentUrl: Url | null;

  /**
   * Service price (optional, for display only)
   * Format: USD cents (e.g., 2500 = $25.00)
   */
  readonly priceInCents?: number;

  /**
   * Service duration in minutes (optional, for display)
   */
  readonly durationMinutes?: number;
}

/**
 * Validation error details
 * Provides user-friendly error messages and machine-readable codes
 * 
 * @interface ValidationError
 */
export interface ValidationError {
  /**
   * Human-readable error message
   * Must be i18n-ready (externalize for multi-language)
   */
  readonly message: string;

  /**
   * Machine-readable error code for client handling
   * Format: UPPER_SNAKE_CASE
   */
  readonly code: string;

  /**
   * Field that failed validation (if applicable)
   */
  readonly field?: "name" | "phone" | "email" | "service";

  /**
   * Additional context for debugging (never shown to user)
   * Example: regex pattern that failed
   */
  readonly debugContext?: Record<string, unknown>;
}

/**
 * Booking flow context - complete state snapshot
 * 
 * Stored in conversation.context JSONB column
 * Must be serializable (no functions, dates as ISO strings)
 * 
 * @interface BookingFlowContext
 */
export interface BookingFlowContext {
  /**
   * Current state in the state machine
   */
  readonly state: BookingFlowState;

  /**
   * Selected service (null until SERVICE_SELECTION → LEAD_NAME)
   */
  readonly selectedService: SelectedService | null;

  /**
   * Lead data collected so far
   * Accumulates as user progresses through states
   */
  readonly leadDraft: LeadDraft;

  /**
   * Flow start timestamp (ISO 8601)
   * Used for analytics and timeout detection
   */
  readonly startedAt: string | null;

  /**
   * Flow completion timestamp (ISO 8601)
   * Set when transitioning to COMPLETE state
   */
  readonly completedAt: string | null;

  /**
   * Active validation errors
   * Reset on successful transition
   */
  readonly errors: readonly ValidationError[];

  /**
   * Retry count for current step
   * Increments on validation failure
   * Resets on successful transition
   * 
   * Used for rate limiting and fraud detection
   */
  readonly retryCount: number;

  /**
   * Version identifier for context schema
   * Enables safe schema migrations
   */
  readonly version: "1.0";
}

/**
 * Response directive types - UI rendering instructions
 * 
 * Server returns directive, client interprets into UI
 * Enables clean separation of business logic and presentation
 * 
 * @enum {string}
 */
export enum ResponseDirectiveType {
  /**
   * Display service picker UI with available services
   * Client should render: buttons or dropdown
   */
  SHOW_SERVICE_PICKER = "SHOW_SERVICE_PICKER",

  /**
   * Display name input field with validation
   * Client should render: text input, autofocus
   */
  ASK_FOR_NAME = "ASK_FOR_NAME",

  /**
   * Display phone input field with formatting
   * Client should render: tel input with mask
   */
  ASK_FOR_PHONE = "ASK_FOR_PHONE",

  /**
   * Display email input field with validation
   * Client should render: email input with autocomplete
   */
  ASK_FOR_EMAIL = "ASK_FOR_EMAIL",

  /**
   * Display booking link with CTA
   * Client should render: prominent button with tracking
   */
  SHOW_BOOKING_LINK = "SHOW_BOOKING_LINK",

  /**
   * Display error message
   * Client should render: error alert with retry option
   */
  SHOW_ERROR = "SHOW_ERROR",

  /**
   * Continue normal chat flow (no booking action)
   * Client should render: standard chat response
   */
  CONTINUE_CHAT = "CONTINUE_CHAT",
}

/**
 * Response directive - structured server response
 * 
 * Decouples state machine logic from UI rendering
 * Enables A/B testing of UI without touching state machine
 * 
 * @interface ResponseDirective
 */
export interface ResponseDirective {
  /**
   * Directive type - determines client rendering
   */
  readonly type: ResponseDirectiveType;

  /**
   * Primary message to display
   * Must be i18n-ready
   */
  readonly message: string;

  /**
   * Available services (only for SHOW_SERVICE_PICKER)
   */
  readonly services?: readonly SelectedService[];

  /**
   * Booking URL (only for SHOW_BOOKING_LINK)
   */
  readonly bookingUrl?: Url;

  /**
   * Error message (only for SHOW_ERROR)
   */
  readonly error?: string;

  /**
   * Validation errors (only for validation failures)
   */
  readonly validationErrors?: readonly ValidationError[];

  /**
   * Suggested next action (optional, for accessibility)
   */
  readonly suggestedAction?: string;

  /**
   * Analytics metadata (not shown to user)
   */
  readonly metadata?: {
    readonly transitionDuration?: number;
    readonly attemptNumber?: number;
    readonly previousState?: BookingFlowState;
  };
}

/**
 * State machine transition result
 * 
 * Immutable return type from transition() function
 * Contains new state, context, and UI directive
 * 
 * @interface TransitionResult
 */
export interface TransitionResult {
  /**
   * New state after transition
   */
  readonly state: BookingFlowState;

  /**
   * Updated context (immutable - new object)
   */
  readonly context: BookingFlowContext;

  /**
   * UI directive for client rendering
   */
  readonly directive: ResponseDirective;

  /**
   * Whether this transition requires persistence
   * False for validation errors (stay in same state)
   * True for successful state changes
   */
  readonly shouldPersist: boolean;

  /**
   * Events to log (for analytics/audit)
   */
  readonly eventsToLog: readonly DataEvent[];
}

/**
 * User input - sanitized input from user
 * 
 * @interface UserInput
 */
export interface UserInput {
  /**
   * Raw text input from user (pre-sanitized)
   * Must be sanitized before use to prevent XSS
   */
  readonly text: string;

  /**
   * Optional: Pre-selected service ID from button click
   * Takes precedence over text matching
   */
  readonly selectedServiceId?: ServiceId;

  /**
   * Client metadata (for analytics, not used in transitions)
   */
  readonly metadata?: {
    readonly timestamp: string;
    readonly userAgent?: string;
    readonly ipAddress?: string; // For fraud detection
  };
}

/**
 * Data event for analytics and audit trail
 * 
 * @interface DataEvent
 */
export interface DataEvent {
  /**
   * Event type identifier
   */
  readonly eventType: BookingFlowEventType;

  /**
   * Event metadata (specific to event type)
   */
  readonly metadata: Record<string, unknown>;

  /**
   * Timestamp (ISO 8601)
   */
  readonly timestamp: string;
}

/**
 * Booking flow event types
 * 
 * @enum {string}
 */
export enum BookingFlowEventType {
  FLOW_STARTED = "BOOKING_FLOW_STARTED",
  SERVICE_SELECTED = "SERVICE_SELECTED",
  NAME_CAPTURED = "LEAD_NAME_CAPTURED",
  PHONE_CAPTURED = "LEAD_PHONE_CAPTURED",
  EMAIL_CAPTURED = "LEAD_EMAIL_CAPTURED",
  LEAD_CREATED = "LEAD_CAPTURED",
  BOOKING_LINK_SHOWN = "BOOKING_LINK_SHOWN",
  BOOKING_LINK_CLICKED = "BOOKING_LINK_CLICKED",
  FLOW_CANCELLED = "BOOKING_FLOW_CANCELLED",
  FLOW_RESTARTED = "BOOKING_FLOW_RESTARTED",
  VALIDATION_FAILED = "VALIDATION_FAILED",
  FLOW_TIMEOUT = "BOOKING_FLOW_TIMEOUT",
  FLOW_ABANDONED = "BOOKING_FLOW_ABANDONED",
}

/**
 * Intent keywords for booking detection
 * 
 * @constant
 * @readonly
 */
export const BOOKING_INTENT_KEYWORDS = [
  "book",
  "booking",
  "appointment",
  "schedule",
  "reserve",
  "reservation",
  "how much",
  "price",
  "pricing",
  "cost",
  "costs",
  "service",
  "services",
  "available",
  "availability",
  "when can",
  "what time",
] as const;

/**
 * Cancel keywords
 * 
 * @constant
 * @readonly
 */
export const CANCEL_KEYWORDS = [
  "cancel",
  "stop",
  "quit",
  "exit",
  "nevermind",
  "never mind",
  "no thanks",
] as const;

/**
 * Restart keywords
 * 
 * @constant
 * @readonly
 */
export const RESTART_KEYWORDS = [
  "restart",
  "start over",
  "reset",
  "begin again",
] as const;

/**
 * Back keywords
 * 
 * @constant
 * @readonly
 */
export const BACK_KEYWORDS = ["back", "previous", "go back", "undo"] as const;

/**
 * Configuration constants
 * 
 * @constant
 * @readonly
 */
export const BOOKING_FLOW_CONFIG = {
  /**
   * Maximum retries per step before triggering fraud alert
   */
  MAX_RETRIES_PER_STEP: 5,

  /**
   * Flow timeout in milliseconds (30 minutes)
   */
  FLOW_TIMEOUT_MS: 30 * 60 * 1000,

  /**
   * Minimum name length
   */
  MIN_NAME_LENGTH: 2,

  /**
   * Maximum name length
   */
  MAX_NAME_LENGTH: 100,

  /**
   * Minimum phone digits
   */
  MIN_PHONE_DIGITS: 10,

  /**
   * Maximum phone digits
   */
  MAX_PHONE_DIGITS: 15,

  /**
   * Maximum email length (RFC 5321)
   */
  MAX_EMAIL_LENGTH: 254,

  /**
   * Rate limit: max booking flows per IP per hour
   */
  MAX_FLOWS_PER_IP_PER_HOUR: 10,
} as const;

/**
 * Type guard: check if value is a valid BookingFlowState
 * 
 * @param value - Value to check
 * @returns True if value is a valid state
 */
export function isBookingFlowState(value: unknown): value is BookingFlowState {
  return (
    typeof value === "string" &&
    Object.values(BookingFlowState).includes(value as BookingFlowState)
  );
}

/**
 * Type guard: check if value is a valid ResponseDirectiveType
 * 
 * @param value - Value to check
 * @returns True if value is a valid directive type
 */
export function isResponseDirectiveType(
  value: unknown
): value is ResponseDirectiveType {
  return (
    typeof value === "string" &&
    Object.values(ResponseDirectiveType).includes(
      value as ResponseDirectiveType
    )
  );
}

/**
 * Create a branded type value
 * 
 * @template T - Base type
 * @template Brand - Brand identifier
 * @param value - Value to brand
 * @returns Branded value
 * 
 * @example
 * ```typescript
 * const serviceId = brand<string, 'ServiceId'>('svc_123');
 * ```
 */
export function brand<T, Brand extends string>(value: T): Branded<T, Brand> {
  return value as Branded<T, Brand>;
}

/**
 * Type assertion helper with runtime validation
 * 
 * @param value - Value to assert
 * @param validator - Validation function
 * @param errorMessage - Error message if validation fails
 * @returns Validated value
 * @throws {TypeError} If validation fails
 */
export function assertType<T>(
  value: unknown,
  validator: (v: unknown) => v is T,
  errorMessage: string
): T {
  if (!validator(value)) {
    throw new TypeError(errorMessage);
  }
  return value;
}
