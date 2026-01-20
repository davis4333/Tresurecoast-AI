import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { ChatRequestSchema } from "@/lib/public/zodSchemas";
import { runTruthEngine, type BotLinkData } from "@/lib/truth/truthEngine";
import { detectTopic } from "@/lib/public/topicDetect";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";
import { retrieve, formatCitedAnswer } from "@/lib/truthMode/retrieve";
import { processBookingFlow } from "@/lib/booking/runtime";
import { BookingFlowState, ResponseDirectiveType } from "@/lib/booking/types";

export const runtime = "nodejs";

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function GET() {
  return methodNotAllowed();
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const { botPublicKey, conversationPublicId, message } = parsed.data;

  const rateLimitCheck = await checkRateLimit(req, "chat", botPublicKey);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimitCheck.error || "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        organizationId: true,
        workspaceId: true,
        status: true,
        name: true,
        greeting: true,
        fallbackText: true,
        businessPhone: true,
        businessEmail: true,
        businessAddress: true,
        hours: true,
        services: true,
        allowlist: { select: { domain: true } },
        links: {
          select: {
            type: true,
            label: true,
            url: true,
          },
        },
      },
    });

    if (!bot) {
      return NextResponse.json(
        { ok: false, error: "Bot not found" },
        { status: 404 }
      );
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "Bot not active" },
        { status: 404 }
      );
    }

    const allowlistDomains = bot.allowlist
      .map((a) => a.domain)
      .filter((d): d is string => typeof d === "string" && d.trim().length > 0);

    const origin = req.headers.get("origin");
    const originHost = getOriginHost(req);
    const host = getRequestHost(req);

    if (!isHostAllowed(allowlistDomains, originHost ?? origin, host)) {
      console.error(
        "[DOMAIN FORBIDDEN]",
        botPublicKey,
        host || origin || "unknown"
      );
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const bind = await enforceTenantBinding({ req, botOrgId: bot.organizationId });
    if (!bind.ok) {
      return NextResponse.json(
        { ok: false, error: bind.error, message: bind.message },
        { status: bind.status }
      );
    }

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { organizationId: bot.organizationId },
      select: {
        cancellationPolicy: true,
        depositPolicy: true,
        refundPolicy: true,
        serviceArea: true,
      },
    });

    let conversation: { id: number; publicId: string } | null = null;

    if (conversationPublicId) {
      conversation = await prisma.conversation.findFirst({
        where: { publicId: conversationPublicId, botId: bot.id },
        select: { id: true, publicId: true },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: bot.organizationId,
          workspaceId: bot.workspaceId,
          botId: bot.id,
        },
        select: { id: true, publicId: true },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const bookingResult = await processBookingFlow({
      organizationId: bot.organizationId,
      conversationId: conversation.id,
      conversationPublicId: conversation.publicId,
      botId: bot.id,
      workspaceId: bot.workspaceId,
      userMessage: message,
    });

    if (bookingResult.handled) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: bookingResult.reply,
        },
      });

      return NextResponse.json({
        ok: true,
        conversationPublicId: conversation.publicId,
        reply: bookingResult.reply,
        intent: "BOOKING_FLOW",
        confidence: 1.0,
        sourcedFrom: ["booking_flow"],
        requiresLeadCapture: false,
        missingFields: [],
        topic: "BOOKING",
        suggestedActions: bookingResult.bookingUrl
          ? [{ type: "book", label: "Book Now", url: bookingResult.bookingUrl }]
          : [],
        externalRedirectUrl: bookingResult.bookingUrl ?? null,
        usedKnowledgeBase: false,
        knowledgeSources: [],
        bookingFlow: {
          state: bookingResult.state,
          directiveType: bookingResult.directiveType,
          services: bookingResult.services,
          leadCreated: bookingResult.leadCreated,
          leadId: bookingResult.leadId,
        },
      });
    }

    const topicResult = detectTopic(message);

    const retrievalResult = await retrieve(bot.id, bot.organizationId, message);

    const truthResult = runTruthEngine({
      userMessage: message,
      bot: {
        name: bot.name,
        greeting: bot.greeting,
        fallbackText: bot.fallbackText,
        businessPhone: bot.businessPhone,
        businessEmail: bot.businessEmail,
        businessAddress: bot.businessAddress,
        hours: bot.hours,
        services: bot.services,
        links: bot.links as BotLinkData[],
      },
      policies: businessProfile
        ? {
            cancellationPolicy: businessProfile.cancellationPolicy,
            depositPolicy: businessProfile.depositPolicy,
            refundPolicy: businessProfile.refundPolicy,
            serviceArea: businessProfile.serviceArea,
          }
        : undefined,
    });

    let finalReply: string;
    let usedKnowledgeBase = false;
    let knowledgeSources: string[] = [];

    if (retrievalResult.hasEnoughEvidence && retrievalResult.hits.length > 0) {
      finalReply = formatCitedAnswer(
        retrievalResult.hits,
        bot.fallbackText || "I don't have that information."
      );
      usedKnowledgeBase = true;
      knowledgeSources = [...new Set(retrievalResult.hits.map((h) => h.title))];
    } else if (
      retrievalResult.hits.length === 0 &&
      truthResult.intent === "MISSING_DATA"
    ) {
      finalReply =
        "I'm not 100% sure from the info I have. Could you tell me more about what you're looking for? I'd be happy to have someone follow up with you if you share your contact info.";
    } else {
      finalReply = truthResult.reply;
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: finalReply,
      },
    });

    const eventBase = {
      organizationId: bot.organizationId,
      workspaceId: bot.workspaceId,
      botId: bot.id,
      conversationId: conversation.id,
    };

    try {
      await prisma.dataEvent.create({
        data: {
          ...eventBase,
          type: "TOPIC_DETECTED",
          topic: topicResult.topic,
          payload: {
            confidence: topicResult.confidence,
            matched: topicResult.matched,
            userMessage: message,
          },
        },
      });

      await prisma.dataEvent.create({
        data: {
          ...eventBase,
          type: "TRUTH_RESPONSE",
          topic: truthResult.topic,
          payload: {
            intent: truthResult.intent,
            confidence: truthResult.confidence,
            sourcedFrom: truthResult.sourcedFrom,
            requiresLeadCapture: truthResult.requiresLeadCapture,
            missingFields: truthResult.missingFields,
            suggestedActions: truthResult.suggestedActions,
          },
        },
      });

      if (truthResult.missingFields.length > 0) {
        await prisma.dataEvent.create({
          data: {
            ...eventBase,
            type: "MISSING_DATA",
            topic: truthResult.topic,
            payload: {
              missingFields: truthResult.missingFields,
              userMessage: message,
            },
          },
        });
      }

      if (truthResult.requiresLeadCapture) {
        await prisma.dataEvent.create({
          data: {
            ...eventBase,
            type: "LEAD_CAPTURE_TRIGGERED",
            topic: truthResult.topic,
            payload: {
              intent: truthResult.intent,
              missingFields: truthResult.missingFields,
            },
          },
        });
      }
    } catch (logError) {
      console.error("[DATA EVENT LOG ERROR]", logError);
    }

    let requiresLeadCapture = truthResult.requiresLeadCapture;

    if (requiresLeadCapture) {
      const existingLead = await prisma.lead.findFirst({
        where: { conversationId: conversation.id },
        select: { id: true },
      });

      if (existingLead) {
        requiresLeadCapture = false;
      }
    }

    const suggestedActions = truthResult.suggestedActions;
    let externalRedirectUrl: string | null = null;
    if (suggestedActions && suggestedActions.length > 0) {
      const firstWithUrl = suggestedActions.find((a) => a.url);
      if (firstWithUrl?.url) {
        externalRedirectUrl = firstWithUrl.url;
      }
    }

    return NextResponse.json({
      ok: true,
      conversationPublicId: conversation.publicId,
      reply: finalReply,
      intent: truthResult.intent,
      confidence: truthResult.confidence,
      sourcedFrom: usedKnowledgeBase ? knowledgeSources : truthResult.sourcedFrom,
      requiresLeadCapture,
      missingFields: truthResult.missingFields,
      topic: truthResult.topic,
      suggestedActions: truthResult.suggestedActions,
      externalRedirectUrl,
      usedKnowledgeBase,
      knowledgeSources,
    });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return methodNotAllowed();
}
export async function PATCH() {
  return methodNotAllowed();
}
export async function DELETE() {
  return methodNotAllowed();
}
export async function OPTIONS() {
  return methodNotAllowed();
}
