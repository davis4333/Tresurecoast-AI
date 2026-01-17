import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { LeadRequestSchema } from "@/lib/public/zodSchemas";

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

  const parsed = LeadRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: firstError?.message || "Invalid request" },
      { status: 400 }
    );
  }

  const { botPublicKey, conversationPublicId, name, email, phone } = parsed.data;

  const rateLimitCheck = await checkRateLimit(req, "leads", botPublicKey);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimitCheck.error || "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const validName = typeof name === "string" && name.length >= 1 && name.length <= 100;
  const validEmail = typeof email === "string" && email.length >= 1 && email.includes("@");
  const validPhone = typeof phone === "string" && phone.length >= 1 && phone.length <= 20;

  try {
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

    const allowlistDomains = bot.allowlist
      .map((a) => a.domain)
      .filter((d): d is string => typeof d === "string" && d.trim().length > 0);

    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (!isHostAllowed(allowlistDomains, origin, host)) {
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

    const conversation = await prisma.conversation.findFirst({
      where: { publicId: conversationPublicId, botId: bot.id },
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

    const existingLead = await prisma.lead.findFirst({
      where: { conversationId: conversation.id },
      select: { publicId: true }
    });

    if (existingLead) {
      return NextResponse.json({ ok: true, leadPublicId: existingLead.publicId });
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: conversation.organizationId,
        workspaceId: conversation.workspaceId,
        botId: conversation.botId,
        conversationId: conversation.id,
        name: validName ? name : null,
        email: validEmail ? email : null,
        phone: validPhone ? phone : null,
        status: "NEW"
      },
      select: { publicId: true }
    });

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
