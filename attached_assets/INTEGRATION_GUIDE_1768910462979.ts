/**
 * Step 42: Booking Flow Integration Guide
 * How to wire the state machine into your existing chat backend
 */

/*
================================================================================
INTEGRATION OVERVIEW
================================================================================

The booking flow state machine is PURE and TESTABLE. It has no DB dependencies.
Your chat backend needs to:

1. Load conversation context (including bookingFlowContext)
2. Fetch available services from OrganizationService table
3. Call transition() function
4. Handle the returned directive
5. Persist updated context if shouldPersist = true
6. Create lead record when state = COMPLETE
7. Log DataEvents for tracking

Below is example code for each step.
*/

/*
================================================================================
STEP 1: EXTEND YOUR CONVERSATION SCHEMA
================================================================================

Your conversations table likely already has a jsonb context column.
Add bookingFlowContext to the type:

```prisma
model Conversation {
  id                String   @id @default(cuid())
  organizationId    String
  botId             String
  sessionId         String
  context           Json?    // Store bookingFlowContext here
  // ... other fields
}
```

TypeScript type:
*/

import type { BookingFlowContext } from "@/lib/booking/bookingFlowTypes";

interface ConversationContext {
  bookingFlow?: BookingFlowContext;
  // ... other context fields you might have
}

/*
================================================================================
STEP 2: LOAD AVAILABLE SERVICES
================================================================================

Helper function to fetch services for an organization:
*/

import { prisma } from "@/lib/prisma";
import type { SelectedService } from "@/lib/booking/bookingFlowTypes";

async function getAvailableServices(
  organizationId: string
): Promise<SelectedService[]> {
  const services = await prisma.organizationService.findMany({
    where: {
      organizationId,
      isActive: true, // Only active services
    },
    select: {
      id: true,
      name: true,
      bookingUrl: true,
      paymentUrl: true,
    },
    orderBy: {
      displayOrder: "asc", // Or createdAt if you don't have displayOrder
    },
  });

  return services.map((s) => ({
    id: s.id,
    name: s.name,
    bookingUrl: s.bookingUrl,
    paymentUrl: s.paymentUrl,
  }));
}

/*
================================================================================
STEP 3: MAIN CHAT HANDLER (Integration Point)
================================================================================

This is where you wire everything together.
Assuming you have an API route like /api/public/chat
*/

import { transition, initBookingContext } from "@/lib/booking/bookingFlowMachine";
import type { UserInput } from "@/lib/booking/bookingFlowTypes";

// Example: /api/public/chat handler
async function handleChatMessage(request: {
  organizationId: string;
  botId: string;
  sessionId: string;
  message: string;
  selectedServiceId?: string; // From button click
}) {
  const { organizationId, botId, sessionId, message, selectedServiceId } = request;

  // 1. Load or create conversation
  let conversation = await prisma.conversation.findFirst({
    where: { organizationId, botId, sessionId },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        organizationId,
        botId,
        sessionId,
        context: { bookingFlow: initBookingContext() },
      },
    });
  }

  // 2. Parse conversation context
  const context = conversation.context as ConversationContext;
  const bookingFlowContext = context.bookingFlow || initBookingContext();

  // 3. Fetch available services
  const availableServices = await getAvailableServices(organizationId);

  // 4. Prepare user input
  const userInput: UserInput = {
    text: message,
    selectedServiceId,
  };

  // 5. Run state machine transition
  const result = transition(bookingFlowContext, userInput, availableServices);

  // 6. Handle persistence
  if (result.shouldPersist) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        context: {
          ...context,
          bookingFlow: result.context,
        },
      },
    });
  }

  // 7. Handle COMPLETE state (create lead)
  if (result.state === "COMPLETE" && result.context.selectedService) {
    await handleLeadCapture({
      conversation,
      leadDraft: result.context.leadDraft,
      selectedService: result.context.selectedService,
      organizationId,
      botId,
    });
  }

  // 8. Log data events
  await logBookingFlowEvents({
    conversationId: conversation.id,
    previousState: bookingFlowContext.state,
    newState: result.state,
    organizationId,
    botId,
  });

  // 9. Return directive to UI
  return {
    directive: result.directive,
    state: result.state,
  };
}

/*
================================================================================
STEP 4: LEAD CAPTURE HANDLER
================================================================================

When state reaches COMPLETE, create the lead record.
*/

import { BOOKING_FLOW_EVENTS } from "@/lib/booking/bookingFlowTypes";

async function handleLeadCapture(params: {
  conversation: any;
  leadDraft: { name?: string; phone?: string; email?: string };
  selectedService: SelectedService;
  organizationId: string;
  botId: string;
}) {
  const { conversation, leadDraft, selectedService, organizationId, botId } = params;

  // Check if lead already exists (prevent duplicates)
  const existingLead = await prisma.lead.findFirst({
    where: {
      conversationId: conversation.id,
      email: leadDraft.email,
    },
  });

  if (existingLead) {
    console.log("Lead already exists, skipping creation");
    return existingLead;
  }

  // Create lead
  const lead = await prisma.lead.create({
    data: {
      organizationId,
      botId,
      conversationId: conversation.id,
      name: leadDraft.name || "Unknown",
      phone: leadDraft.phone,
      email: leadDraft.email,
      // Store service context
      metadata: {
        selectedServiceId: selectedService.id,
        selectedServiceName: selectedService.name,
        bookingUrl: selectedService.bookingUrl || selectedService.paymentUrl,
      },
      status: "NEW",
      source: "BOOKING_FLOW",
    },
  });

  // Log lead capture event
  await prisma.dataEvent.create({
    data: {
      organizationId,
      botId,
      conversationId: conversation.id,
      leadId: lead.id,
      eventType: BOOKING_FLOW_EVENTS.LEAD_CAPTURED_COMPLETE,
      metadata: {
        serviceName: selectedService.name,
        serviceId: selectedService.id,
      },
    },
  });

  return lead;
}

/*
================================================================================
STEP 5: DATA EVENT LOGGING
================================================================================

Log events for analytics and tracking.
*/

async function logBookingFlowEvents(params: {
  conversationId: string;
  previousState: string;
  newState: string;
  organizationId: string;
  botId: string;
}) {
  const { conversationId, previousState, newState, organizationId, botId } = params;

  // Map state transitions to events
  const eventMapping: Record<string, string> = {
    "IDLE->SERVICE_SELECTION": BOOKING_FLOW_EVENTS.STARTED,
    "SERVICE_SELECTION->LEAD_NAME": BOOKING_FLOW_EVENTS.SERVICE_SELECTED,
    "LEAD_NAME->LEAD_PHONE": BOOKING_FLOW_EVENTS.LEAD_NAME_CAPTURED,
    "LEAD_PHONE->LEAD_EMAIL": BOOKING_FLOW_EVENTS.LEAD_PHONE_CAPTURED,
    "LEAD_EMAIL->COMPLETE": BOOKING_FLOW_EVENTS.LEAD_EMAIL_CAPTURED,
  };

  const eventKey = `${previousState}->${newState}`;
  const eventType = eventMapping[eventKey];

  if (eventType) {
    await prisma.dataEvent.create({
      data: {
        organizationId,
        botId,
        conversationId,
        eventType,
        metadata: {
          transition: eventKey,
        },
      },
    });
  }

  // Special: log booking link shown
  if (newState === "COMPLETE") {
    await prisma.dataEvent.create({
      data: {
        organizationId,
        botId,
        conversationId,
        eventType: BOOKING_FLOW_EVENTS.BOOKING_LINK_SHOWN,
        metadata: {},
      },
    });
  }
}

/*
================================================================================
STEP 6: UI RESPONSE HANDLER (Widget Side)
================================================================================

In your chat widget frontend, handle the directive types:
*/

// Example React component (pseudo-code)
function ChatWidget() {
  function handleDirective(directive: any) {
    switch (directive.type) {
      case "SHOW_SERVICE_PICKER":
        // Step 43: render service buttons
        return (
          <div>
            <p>{directive.message}</p>
            {directive.services?.map((service) => (
              <button
                key={service.id}
                onClick={() => selectService(service.id)}
              >
                {service.name}
              </button>
            ))}
          </div>
        );

      case "ASK_FOR_NAME":
      case "ASK_FOR_PHONE":
      case "ASK_FOR_EMAIL":
        return <p>{directive.message}</p>;

      case "SHOW_BOOKING_LINK":
        return (
          <div>
            <p>{directive.message}</p>
            <a
              href={directive.bookingUrl}
              target="_blank"
              onClick={() => trackBookingLinkClick(directive.bookingUrl)}
            >
              Click here to complete your booking
            </a>
          </div>
        );

      case "SHOW_ERROR":
        return <p className="error">{directive.message}</p>;

      case "CONTINUE_CHAT":
      default:
        return <p>{directive.message}</p>;
    }
  }

  // ... rest of component
}

/*
================================================================================
STEP 7: BOOKING LINK CLICK TRACKING (Step 44)
================================================================================

When user clicks the booking link, log the event:
*/

async function trackBookingLinkClick(params: {
  conversationId: string;
  organizationId: string;
  botId: string;
  bookingUrl: string;
}) {
  await fetch("/api/public/track-click", {
    method: "POST",
    body: JSON.stringify({
      conversationId: params.conversationId,
      organizationId: params.organizationId,
      botId: params.botId,
      eventType: "BOOKING_LINK_CLICKED",
      url: params.bookingUrl,
    }),
  });
}

/*
================================================================================
TESTING CHECKLIST
================================================================================

□ Unit tests pass (pnpm vitest run)
□ Create test conversation with booking flow
□ Verify state persists across messages
□ Verify lead is created on COMPLETE
□ Verify DataEvents are logged
□ Test cancel/restart/back commands
□ Test invalid inputs at each step
□ Test service with no booking URL
□ Test service selection by name vs ID

================================================================================
COMMON GOTCHAS
================================================================================

1. **Double lead creation**: Check for existing lead before creating
2. **State getting stuck**: Always handle shouldPersist correctly
3. **Service mismatch**: Use selectedServiceId from transition, not from input
4. **Conversation not found**: Create conversation if missing
5. **Context not persisting**: Make sure to spread existing context
6. **Events not logging**: Check organizationId/botId are correct

================================================================================
NEXT STEPS
================================================================================

After Step 42 works:
- Step 43: Service picker UI with buttons
- Step 44: Booking link click tracking + analytics
- Step 45: Hours integration ("are you open now?")
*/

export {
  handleChatMessage,
  handleLeadCapture,
  logBookingFlowEvents,
  getAvailableServices,
};
