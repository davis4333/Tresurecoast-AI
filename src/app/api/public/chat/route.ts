import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

type ChatRequest = {
  botPublicKey: string;
  conversationPublicId?: string | null;
  message: string;
};

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: Request) {
  let body: Partial<ChatRequest>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { botPublicKey, conversationPublicId, message } = body;

  // Validate botPublicKey
  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json({ ok: false, error: "Invalid bot key" }, { status: 400 });
  }

  // Validate conversationPublicId if present
  if (
    conversationPublicId !== null &&
    conversationPublicId !== undefined &&
    !isValidUUID(conversationPublicId)
  ) {
    return NextResponse.json({ ok: false, error: "Invalid conversation id" }, { status: 400 });
  }

  // Validate message
  const trimmedMessage = message?.trim();
  if (!trimmedMessage || trimmedMessage.length === 0 || trimmedMessage.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "Message must be 1-2000 characters" },
      { status: 400 },
    );
  }

  try {
    // Resolve bot
    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        organizationId: true,
        workspaceId: true,
        status: true,
        greeting: true,
        fallbackText: true,
      },
    });

    if (!bot) {
      return NextResponse.json({ ok: false, error: "Bot not found" }, { status: 404 });
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "Bot not active" }, { status: 404 });
    }

    // Resolve or create conversation
    let conversation: { id: number; publicId: string } | null = null;

    if (conversationPublicId && isValidUUID(conversationPublicId)) {
      conversation = await prisma.conversation.findFirst({
        where: {
          publicId: conversationPublicId,
          botId: bot.id,
        },
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

    // Create user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: trimmedMessage,
      },
    });

    // Generate deterministic assistant reply
    let reply: string;

    if (trimmedMessage.includes("?")) {
      reply = bot.fallbackText?.trim() || "Thanks — can I get your name and phone number?";
    } else {
      const greeting = bot.greeting?.trim() || "How can I help?";
      reply = `Got it. ${greeting}`;
    }

    // Ensure reply is under 500 chars
    if (reply.length > 500) {
      reply = reply.slice(0, 497) + "...";
    }

    // Create assistant message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    return NextResponse.json({
      ok: true,
      conversationPublicId: conversation.publicId,
      assistant: {
        role: "assistant",
        content: reply,
      },
    });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
