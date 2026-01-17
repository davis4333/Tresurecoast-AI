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

export async function GET() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  let body: Partial<LeadRequest>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { botPublicKey, conversationPublicId, name, email, phone } = body;

  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid bot key" },
      { status: 400 }
    );
  }

  if (!isValidUUID(conversationPublicId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid conversation id" },
      { status: 400 }
    );
  }

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim();
  const trimmedPhone = phone?.trim();

  const validName = !!trimmedName && trimmedName.length >= 1 && trimmedName.length <= 100;
  const validEmail = !!trimmedEmail && trimmedEmail.length >= 1 && trimmedEmail.includes("@");
  const validPhone = !!trimmedPhone && trimmedPhone.length >= 1 && trimmedPhone.length <= 20;

  if (!validName && !validEmail && !validPhone) {
    return NextResponse.json(
      { ok: false, error: "At least one contact field required" },
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

    // 2) Enforce domain allowlist
    const allowlistDomains = bot.allowlist.map((a) => a.domain);
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (!isHostAllowed(allowlistDomains, origin, host)) {
      console.error("[DOMAIN FORBIDDEN]", botPublicKey, host || origin || "unknown");
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // 3) Fetch conversation (must belong to bot)
    const conversation = await prisma.conversation.findFirst({
      where: {
        publicId: conversationPublicId,
        botId: bot.id
      },
      select: {
        id: true,
        organizationId: true,
        workspaceId: true,
        botId: true
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { ok: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 4) Deduplicate lead per conversation
    const existingLead = await prisma.lead.findFirst({
      where: { conversationId: conversation.id },
      select: { publicId: true }
    });

    if (existingLead) {
      return NextResponse.json({ ok: true, leadPublicId: existingLead.publicId });
    }

    // 5) Create lead
    const lead = await prisma.lead.create({
      data: {
        organizationId: conversation.organizationId,
        workspaceId: conversation.workspaceId,
        botId: conversation.botId,
        conversationId: conversation.id,
        name: validName ? trimmedName : null,
        email: validEmail ? trimmedEmail : null,
        phone: validPhone ? trimmedPhone : null,
        status: "NEW"
      },
      select: { publicId: true }
    });

    // 6) Confirmation message only for new lead
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: "Thanks! We'll be in touch shortly."
      }
    });

    return NextResponse.json({ ok: true, leadPublicId: lead.publicId });
  } catch (error) {
    console.error("[LEAD CREATE ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
