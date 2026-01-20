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
import { triggerHotLeadNotification, triggerBookingClickNotification } from "@/lib/notifications/triggers";
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
 * Create lead from booking flow context
 * Idempotent: uses unique(conversationId, serviceId) constraint with upsert pattern
 */
async function createLeadFromBooking(
  input: BookingFlowInput,
  context: BookingFlowContext
): Promise<number | null> {
  if (!context.leadDraft.name || !context.leadDraft.email) {
    return null;
  }

  const serviceIdInt = context.selectedService?.id
    ? parseInt(String(context.selectedService.id), 10)
    : null;

  const validServiceId = serviceIdInt !== null && !isNaN(serviceIdInt) ? serviceIdInt : undefined;

  try {
    const leadData = {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      botId: input.botId,
      conversationId: input.conversationId,
      name: context.leadDraft.name,
      email: context.leadDraft.email,
      phone: context.leadDraft.phone ?? null,
      status: "NEW" as const,
      score: 70,
      temperature: "HOT" as const,
      scoreReasons: ["Completed booking flow", "Provided contact information"],
      ...(validServiceId !== undefined && { serviceId: validServiceId }),
    };

    const lead = await prisma.lead.create({
      data: leadData as Parameters<typeof prisma.lead.create>[0]["data"],
    });

    await logGranularBookingEvent(input, "BOOKING_LEAD_CREATED", {
      leadId: lead.id,
      serviceId: validServiceId ?? null,
      serviceName: context.selectedService?.name ?? null,
    });

    triggerHotLeadNotification({
      organizationId: input.organizationId,
      leadId: lead.id,
      leadPublicId: lead.publicId,
      lead: {
        name: context.leadDraft.name,
        email: context.leadDraft.email,
        phone: context.leadDraft.phone ?? null,
        score: 70,
        temperature: "HOT",
        serviceName: context.selectedService?.name ?? null,
      },
    }).catch((err) => {
      console.error("[NOTIFICATION] Hot lead notification failed:", err);
    });

    return lead.id;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const whereClause = {
        conversationId: input.conversationId,
        ...(validServiceId !== undefined && { serviceId: validServiceId }),
      };

      const existingLead = await prisma.lead.findFirst({
        where: whereClause,
        select: { id: true },
      } as Parameters<typeof prisma.lead.findFirst>[0]);
      return existingLead?.id ?? null;
    }
    throw error;
  }
}

type BookingAnalyticsEventType = 
  | "BOOKING_SERVICE_SELECTED"
  | "BOOKING_LEAD_CREATED"
  | "BOOKING_LINK_SHOWN"
  | "BOOKING_LINK_CLICKED";

/**
 * Log granular booking analytics events
 */
async function logGranularBookingEvent(
  input: BookingFlowInput,
  eventType: BookingAnalyticsEventType,
  metadata: Record<string, unknown>
): Promise<void> {
  try {
    const eventData = {
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      botId: input.botId,
      conversationId: input.conversationId,
      type: eventType,
      topic: "BOOKING",
      payload: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };

    await prisma.dataEvent.create({
      data: eventData as unknown as Parameters<typeof prisma.dataEvent.create>[0]["data"],
    });
  } catch (error) {
    console.error(`[${eventType} LOG ERROR]`, error);
  }
}

/**
 * Log BOOKING_LINK_CLICKED event (exported for click tracking API)
 * Also triggers booking click notification if configured
 */
export async function logBookingLinkClicked(
  organizationId: number,
  workspaceId: number,
  botId: number,
  conversationId: number,
  metadata: { leadId?: number; bookingUrl?: string }
): Promise<void> {
  const input: BookingFlowInput = {
    organizationId,
    workspaceId,
    botId,
    conversationId,
    conversationPublicId: "",
    userMessage: "",
  };
  await logGranularBookingEvent(input, "BOOKING_LINK_CLICKED", metadata);

  if (metadata.leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: metadata.leadId },
      select: {
        publicId: true,
        name: true,
        email: true,
        phone: true,
        service: { select: { name: true } },
      },
    });

    if (lead) {
      triggerBookingClickNotification({
        organizationId,
        leadId: metadata.leadId,
        leadPublicId: lead.publicId,
        lead: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          serviceName: lead.service?.name ?? null,
        },
      }).catch((err) => {
        console.error("[NOTIFICATION] Booking click notification failed:", err);
      });
    }
  }
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
