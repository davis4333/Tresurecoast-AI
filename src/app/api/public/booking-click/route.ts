import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { logBookingLinkClicked } from "@/lib/booking/runtime";

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

    if (typeof conversationPublicId !== "string" || !isValidUUID(conversationPublicId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid conversationPublicId" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { publicId: conversationPublicId },
      select: {
        id: true,
        botId: true,
        bot: {
          select: {
            publicKey: true,
            organizationId: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!conversation || conversation.bot.publicKey !== botPublicKey) {
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
