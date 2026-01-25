import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { logBookingLinkClicked } from "@/lib/booking/runtime";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { botPublicKey, conversationPublicId, bookingUrl } = body;

    if (typeof botPublicKey !== "string" || !isValidUUID(botPublicKey)) {
      return NextResponse.json(
        { ok: false, error: "Invalid botPublicKey" },
        { status: 400 }
      );
    }

    const rateLimitCheck = await checkRateLimit(request, "booking_click", botPublicKey);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error || "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Fetch bot to get allowlist and organization for security checks
    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        organizationId: true,
        allowlist: { select: { domain: true } },
      },
    });

    if (!bot) {
      return NextResponse.json(
        { ok: false, error: "Bot not found" },
        { status: 404 }
      );
    }

    // Host allowlist check
    const allowlistDomains = bot.allowlist
      .map((a) => a.domain)
      .filter((d): d is string => typeof d === "string" && d.trim().length > 0);

    const origin = request.headers.get("origin");
    const originHost = getOriginHost(request);
    const host = getRequestHost(request);

    if (!isHostAllowed(allowlistDomains, originHost ?? origin, host)) {
      console.warn("[booking-click] Blocked request from unauthorized domain", {
        botPublicKey,
        origin,
        host,
      });
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Tenant binding check
    const bind = await enforceTenantBinding({ req: request, botOrgId: bot.organizationId });
    if (!bind.ok) {
      return NextResponse.json(
        { ok: false, error: bind.error, message: bind.message },
        { status: bind.status }
      );
    }

    if (typeof conversationPublicId !== "string" || !isValidUUID(conversationPublicId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid conversationPublicId" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        publicId: conversationPublicId,
        botId: bot.id,
      },
      select: {
        id: true,
        botId: true,
        bot: {
          select: {
            organizationId: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: { conversationId: conversation.id },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    await logBookingLinkClicked(
      conversation.bot.organizationId,
      conversation.bot.workspaceId,
      conversation.botId,
      conversation.id,
      {
        leadId: lead?.id,
        bookingUrl: typeof bookingUrl === "string" ? bookingUrl : undefined,
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[BOOKING_CLICK] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to track booking click" },
      { status: 500 }
    );
  }
}
