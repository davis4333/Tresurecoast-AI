import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

type LeadRequest = {
  botPublicKey: string;
  conversationPublicId: string;
  name?: string;
  email?: string;
  phone?: string;
};

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: Request) {
  let body: Partial<LeadRequest>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { botPublicKey, conversationPublicId, name, email, phone } = body;

  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json({ ok: false, error: "Invalid bot key" }, { status: 400 });
  }

  if (!isValidUUID(conversationPublicId)) {
    return NextResponse.json({ ok: false, error: "Invalid conversation id" }, { status: 400 });
  }

  const trimmedName = name?.trim() || null;
  const trimmedEmail = email?.trim() || null;
  const trimmedPhone = phone?.trim() || null;

  if (!trimmedName && !trimmedEmail && !trimmedPhone) {
    return NextResponse.json(
      { ok: false, error: "At least one contact field required" },
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
        allowlist: {
          select: { domain: true }
        }
      }
    });

    if (!bot) {
      return NextResponse.json({ ok: false, error: "Bot not found" }, { status: 404 });
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "Bot not active" }, { status: 404 });
    }

    if (bot.allowlist.length > 0) {
      const origin = req.headers.get("origin") || "";
      const host = req.headers.get("host") || "";

      let requestDomain = "";

      if (origin) {
        try {
          const url = new URL(origin);
          requestDomain = url.hostname.toLowerCase();
        } catch {
          requestDomain = origin.toLowerCase();
        }
      } else if (host) {
        const hostPart = host.split(":")[0];
        requestDomain = hostPart ? hostPart.toLowerCase() : "";
      }

      const allowedDomains = bot.allowlist.map((a) => a.domain.toLowerCase());
      const isAllowed = allowedDomains.some(
        (d) => requestDomain === d || requestDomain.endsWith(`.${d}`)
      );

      if (!isAllowed) {
        return NextResponse.json({ ok: false, error: "Domain not allowed" }, { status: 403 });
      }
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        publicId: conversationPublicId,
        botId: bot.id
      },
      select: { id: true }
    });

    if (!conversation) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }

    const existingLead = await prisma.lead.findFirst({
      where: { conversationId: conversation.id },
      select: { publicId: true }
    });

    if (existingLead) {
      return NextResponse.json({
        ok: true,
        leadPublicId: existingLead.publicId
      });
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: bot.organizationId,
        workspaceId: bot.workspaceId,
        botId: bot.id,
        conversationId: conversation.id,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone
      },
      select: { publicId: true }
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: "Thanks! We'll be in touch soon."
      }
    });

    return NextResponse.json({
      ok: true,
      leadPublicId: lead.publicId
    });
  } catch (error) {
    console.error("[LEADS ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
