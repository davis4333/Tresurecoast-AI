import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

function isHostAllowed(
  allowlist: string[],
  origin: string | null,
  host: string | null
): boolean {
  if (allowlist.length === 0) return true;

  let hostname: string | null = null;

  if (origin) {
    try {
      hostname = new URL(origin).hostname;
    } catch {
      // ignore invalid origin
    }
  }

  if (!hostname && host) {
    hostname = host.split(":")[0] || null;
  }

  if (!hostname) return false;

  hostname = hostname.toLowerCase();

  for (const allowed of allowlist) {
    const normalizedAllowed = allowed.trim().toLowerCase();
    if (!normalizedAllowed) continue;

    if (hostname === normalizedAllowed) return true;
    if (hostname.endsWith("." + normalizedAllowed)) return true;
  }

  return false;
}

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
    // 1) Fetch bot (existence + ACTIVE + allowlist)
    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        status: true,
        allowlist: { select: { domain: true } }
      }
    });

    if (!bot) {
      return NextResponse.json({ ok: false, error: "Bot not found" }, { status: 404 });
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "Bot not active" }, { status: 404 });
    }

    // 2) Enforce domain allowlist BEFORE conversation lookup
    const allowlistDomains = bot.allowlist.map((a) => a.domain);
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (!isHostAllowed(allowlistDomains, origin, host)) {
      console.error("[DOMAIN FORBIDDEN]", botPublicKey, host || origin || "unknown");
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // 3) Fetch conversation by publicId + botId
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

    // 4) Fetch last 200 messages, return oldest -> newest
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
