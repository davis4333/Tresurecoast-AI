/**
 * @fileoverview Booking Flow Runtime Orchestrator
 * @module lib/booking/runtime
 * @version 1.0.0
 * 
 * Bridges the pure FSM with the live chat runtime.
 * Handles persistence, service loading, and lead creation.
 * 
 * NO AI HALLUCINATIONS - booking links come ONLY from OrganizationService records.
 * 
 * @author Treasure Coast AI Engineering Team
 * @license Proprietary
 * @copyright 2026 Treasure Coast AI. All rights reserved.
 */

import { prisma } from "@/lib/prisma";
import {
  transition,
  initBookingContext,
  isBookingIntent,
  isRestart,
  isCancel,
} from "./stateMachine";
import {
  BookingFlowState,
  ResponseDirectiveType,
  type BookingFlowContext,
  type SelectedService,
  type TransitionResult,
  type ServiceId,
  type Url,
} from "./types";

type Branded<T, Brand extends string> = T & { __brand: Brand };

function brandServiceId(value: string): ServiceId {
  return value as unknown as ServiceId;
}

function brandUrl(value: string): Url {
  return value as unknown as Url;
}

/**
 * Runtime input for booking flow processing
 */
export interface BookingFlowInput {
  readonly organizationId: number;
  readonly conversationId: number;
  readonly conversationPublicId: string;
  readonly botId: number;
  readonly workspaceId: number;
  readonly userMessage: string;
  readonly selectedServiceId?: string;
}

/**
 * Runtime output from booking flow processing
 */
export interface BookingFlowOutput {
  readonly handled: boolean;
  readonly reply: string;
  readonly directiveType: ResponseDirectiveType;
  readonly bookingUrl?: string;
  readonly services?: SelectedService[];
  readonly leadCreated?: boolean;
  readonly leadId?: number;
  readonly state: BookingFlowState;
}

/**
 * Load organization services from database
 * CRITICAL: These are the ONLY source of booking URLs - NO AI hallucinations
 */
async function loadOrganizationServices(
  organizationId: number
): Promise<SelectedService[]> {
  const services = await prisma.organizationService.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      priceCents: true,
      bookingUrl: true,
      paymentUrl: true,
    },
  });

  return services.map((s) => ({
    id: brandServiceId(s.id.toString()),
    name: s.name,
    priceCents: s.priceCents ?? undefined,
    bookingUrl: s.bookingUrl ? brandUrl(s.bookingUrl) : null,
    paymentUrl: s.paymentUrl ? brandUrl(s.paymentUrl) : null,
  }));
}

/**
 * Load booking state from conversation
 */
async function loadBookingState(
  conversationId: number
): Promise<BookingFlowContext> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { bookingState: true },
  });

  if (!conversation?.bookingState) {
    return initBookingContext();
  }

  try {
    const state = conversation.bookingState as unknown as BookingFlowContext;
    if (state && typeof state === "object" && "state" in state && "version" in state) {
      return state;
    }
    return initBookingContext();
  } catch {
    return initBookingContext();
  }
}

/**
 * Persist booking state to conversation
 */
async function persistBookingState(
  conversationId: number,
  context: BookingFlowContext
): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { bookingState: context as unknown as object },
  });
}

/**
 * Create lead from booking flow context (idempotent - skips if lead already exists)
 */
async function createLeadFromBooking(
  input: BookingFlowInput,
  context: BookingFlowContext
): Promise<number | null> {
  if (!context.leadDraft.name || !context.leadDraft.email) {
    return null;
  }

  const existingLead = await prisma.lead.findFirst({
    where: { conversationId: input.conversationId },
    select: { id: true },
  });

  if (existingLead) {
    return existingLead.id;
  }

  const lead = await prisma.lead.create({
    data: {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      botId: input.botId,
      conversationId: input.conversationId,
      name: context.leadDraft.name,
      email: context.leadDraft.email,
      phone: context.leadDraft.phone ?? null,
      status: "NEW",
      score: 70,
      temperature: "HOT",
      scoreReasons: ["Completed booking flow", "Provided contact information"],
    },
  });

  return lead.id;
}

/**
 * Log booking flow events
 */
async function logBookingEvents(
  input: BookingFlowInput,
  result: TransitionResult
): Promise<void> {
  for (const event of result.eventsToLog) {
    try {
      await prisma.dataEvent.create({
        data: {
          organizationId: input.organizationId,
          workspaceId: input.workspaceId,
          botId: input.botId,
          conversationId: input.conversationId,
          type: "BOOKING_FLOW_EVENT",
          topic: "BOOKING",
          payload: {
            eventType: String(event.eventType),
            timestamp: event.timestamp,
            data: JSON.parse(JSON.stringify(event.metadata)),
          },
        },
      });
    } catch (error) {
      console.error("[BOOKING EVENT LOG ERROR]", error);
    }
  }
}

/**
 * Process a user message through the booking flow
 * 
 * This is the main entry point that:
 * 1. Checks if booking flow should be activated
 * 2. Loads current state and available services
 * 3. Runs the pure FSM transition
 * 4. Persists state changes
 * 5. Creates leads when flow completes
 * 6. Returns structured response for chat API
 */
export async function processBookingFlow(
  input: BookingFlowInput
): Promise<BookingFlowOutput> {
  const services = await loadOrganizationServices(input.organizationId);
  const currentContext = await loadBookingState(input.conversationId);

  const isActive = currentContext.state !== BookingFlowState.IDLE;
  const hasBookingIntent = isBookingIntent(input.userMessage);
  const hasServices = services.length > 0;

  if (!isActive && !hasBookingIntent) {
    return {
      handled: false,
      reply: "",
      directiveType: ResponseDirectiveType.CONTINUE_CHAT,
      state: BookingFlowState.IDLE,
    };
  }

  if (!isActive && hasBookingIntent && !hasServices) {
    return {
      handled: false,
      reply: "",
      directiveType: ResponseDirectiveType.CONTINUE_CHAT,
      state: BookingFlowState.IDLE,
    };
  }

  if (
    currentContext.state === BookingFlowState.COMPLETE &&
    !isRestart(input.userMessage) &&
    !isCancel(input.userMessage)
  ) {
    return {
      handled: false,
      reply: "",
      directiveType: ResponseDirectiveType.CONTINUE_CHAT,
      state: BookingFlowState.COMPLETE,
    };
  }

  const userInput = {
    text: input.userMessage,
    selectedServiceId: input.selectedServiceId
      ? brandServiceId(input.selectedServiceId)
      : undefined,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  };

  const result = transition(currentContext, userInput, services);

  if (result.shouldPersist) {
    await persistBookingState(input.conversationId, result.context);
  }

  await logBookingEvents(input, result);

  let leadCreated = false;
  let leadId: number | undefined;

  if (
    result.state === BookingFlowState.COMPLETE &&
    result.context.leadDraft.name &&
    result.context.leadDraft.email
  ) {
    const createdLeadId = await createLeadFromBooking(input, result.context);
    if (createdLeadId) {
      leadCreated = true;
      leadId = createdLeadId;
    }
  }

  return {
    handled: true,
    reply: result.directive.message,
    directiveType: result.directive.type,
    bookingUrl: result.directive.bookingUrl as string | undefined,
    services: result.directive.services
      ? [...result.directive.services]
      : undefined,
    leadCreated,
    leadId,
    state: result.state,
  };
}

/**
 * Check if a message should activate the booking flow
 * Useful for pre-filtering before full processing
 */
export function shouldProcessBookingFlow(
  message: string,
  currentState?: BookingFlowState | null
): boolean {
  if (currentState && currentState !== BookingFlowState.IDLE) {
    return true;
  }
  return isBookingIntent(message);
}

/**
 * Reset booking flow for a conversation
 * Useful for admin actions or timeouts
 */
export async function resetBookingFlow(conversationId: number): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { bookingState: initBookingContext() as unknown as object },
  });
}
