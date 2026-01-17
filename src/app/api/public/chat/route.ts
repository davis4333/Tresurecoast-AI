import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

type ChatRequest = {
  botPublicKey: string;
  conversationPublicId?: string | null;
  message: string;
};

function isHostAllowed(
  allowlist: string[],
  origin: string | null,
  host: string | null
): boolean {
  if (allowlist.length === 0) {
    return true;
  }

  let hostname: string | null = null;

  if (origin) {
    try {
      hostname = new URL(origin).hostname;
    } catch {
      // Invalid origin
    }
  }

  if (!hostname && host) {
    hostname = host.split(":")[0] || null;
  }

  if (!hostname) {
    return false;
  }

  hostname = hostname.toLowerCase();

  for (const allowed of allowlist) {
    const normalizedAllowed = allowed.trim().toLowerCase();
    if (!normalizedAllowed) continue;
    if (hostname === normalizedAllowed) {
      return true;
    }
    if (hostname.endsWith("." + normalizedAllowed)) {
      return true;
    }
  }

  return false;
}

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  let body: Partial<ChatRequest>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { botPublicKey, conversationPublicId, message } = body;

  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid bot key" },
      { status: 400 }
    );
  }

  if (
    conversationPublicId !== null &&
    conversationPublicId !== undefined &&
    !isValidUUID(conversationPublicId)
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid conversation id" },
      { status: 400 }
    );
  }

  const trimmedMessage = message?.trim();
  if (!trimmedMessage || trimmedMessage.length === 0 || trimmedMessage.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "Message must be 1-2000 characters" },
      { status: 400 }
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
        greeting: true,
        fallbackText: true,
        allowlist: {
          select: {
            domain: true
          }
        }
      }
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

    const allowlistDomains = bot.allowlist.map((a) => a.domain);
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (!isHostAllowed(allowlistDomains, origin, host)) {
      console.error("[DOMAIN FORBIDDEN]", botPublicKey, host || origin || "unknown");
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    let conversation: { id: number; publicId: string } | null = null;

    if (conversationPublicId && isValidUUID(conversationPublicId)) {
      conversation = await prisma.conversation.findFirst({
        where: {
          publicId: conversationPublicId,
          botId: bot.id
        },
        select: { id: true, publicId: true }
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: bot.organizationId,
          workspaceId: bot.workspaceId,
          botId: bot.id
        },
        select: { id: true, publicId: true }
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: trimmedMessage
      }
    });

    let reply: string;
    let usedFallback = false;

    if (trimmedMessage.includes("?")) {
      reply =
        bot.fallbackText?.trim() ||
        "Thanks - can I get your name and phone number?";
      usedFallback = true;
    } else {
      const greeting = bot.greeting?.trim() || "How can I help?";
      reply = `Got it. ${greeting}`;
    }

    if (reply.length > 500) {
      reply = reply.slice(0, 497) + "...";
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply
      }
    });

    let leadCaptureRequested = false;

    if (usedFallback) {
      const existingLead = await prisma.lead.findFirst({
        where: {
          conversationId: conversation.id
        },
        select: { id: true }
      });

      if (!existingLead) {
        leadCaptureRequested = true;
      }
    }

    return NextResponse.json({
      ok: true,
      conversationPublicId: conversation.publicId,
      assistant: {
        role: "assistant",
        content: reply
      },
      leadCaptureRequested
    });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
