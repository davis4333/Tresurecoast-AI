import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function GET(
  req: Request,
  { params }: { params: { conversationPublicId: string } }
) {
  const conversationPublicId = params?.conversationPublicId;

  if (!isValidUUID(conversationPublicId)) {
    return NextResponse.json({ ok: false, error: "Invalid conversation id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const botPublicKey = url.searchParams.get("botPublicKey");

  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json({ ok: false, error: "Invalid bot key" }, { status: 400 });
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { publicId: conversationPublicId, bot: { publicKey: botPublicKey } },
      select: { id: true }
    });

    if (!conversation) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      select: { role: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const orderedMessages = messages.reverse();

    return NextResponse.json({
      ok: true,
      messages: orderedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error("[PUBLIC MESSAGES ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
