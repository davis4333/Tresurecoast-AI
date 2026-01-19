import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";

export const runtime = "nodejs";

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function OPTIONS() {
  return methodNotAllowed();
}

export async function GET(
  req: Request,
  { params }: { params: { conversationPublicId: string } }
) {
  const { conversationPublicId } = params;

  if (!isValidUUID(conversationPublicId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid conversation id" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const botPublicKey = url.searchParams.get("botPublicKey");

  if (!botPublicKey || !isValidUUID(botPublicKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid bot key" },
      { status: 400 }
    );
  }

  try {
    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        status: true,
        organizationId: true,
        allowlist: { select: { domain: true } }
      }
    });

    if (!bot) {
      return NextResponse.json({ ok: false, error: "Bot not found" }, { status: 404 });
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "Bot not active" }, { status: 404 });
    }

    const allowlistDomains = bot.allowlist.map((a) => a.domain);
    const origin = req.headers.get("origin");
    const originHost = getOriginHost(req);
    const host = getRequestHost(req);

    if (!isHostAllowed(allowlistDomains, originHost ?? origin, host)) {
      console.error("[DOMAIN FORBIDDEN]", botPublicKey, host || origin || "unknown");
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const bind = await enforceTenantBinding({ req, botOrgId: bot.organizationId });
    if (!bind.ok) {
      return NextResponse.json(
        { ok: false, error: bind.error, message: bind.message },
        { status: bind.status }
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        publicId: conversationPublicId,
        botId: bot.id
      },
      select: { id: true }
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const dbMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      select: {
        role: true,
        content: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });

    const messages = dbMessages
      .reverse()
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.createdAt.toISOString()
      }));

    return NextResponse.json({ ok: true, messages });
  } catch (error) {
    console.error("[MESSAGES FETCH ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST() {
  return methodNotAllowed();
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
