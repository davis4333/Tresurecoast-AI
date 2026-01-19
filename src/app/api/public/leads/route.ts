import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { LeadRequestSchema } from "@/lib/public/zodSchemas";
import { scoreLead } from "@/lib/leads/scoreLead";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";
import { notifyNewLead } from "@/lib/notifications/webhooks";

export const runtime = "nodejs";

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
        organizationId: true,
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
    const originHost = getOriginHost(req);
    const host = getRequestHost(req);

    if (!isHostAllowed(allowlistDomains, originHost ?? origin, host)) {
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

    const bind = await enforceTenantBinding({ req, botOrgId: bot.organizationId });
    if (!bind.ok) {
      return NextResponse.json(
        { ok: false, error: bind.error, message: bind.message },
        { status: bind.status }
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

    const scoreInput = {
      lead: {
        name: validName ? name : null,
        email: validEmail ? email : null,
        phone: validPhone ? phone : null,
      },
      signals: {},
    };

    const scoreResult = scoreLead(scoreInput);

    const lead = await prisma.lead.create({
      data: {
        organizationId: conversation.organizationId,
        workspaceId: conversation.workspaceId,
        botId: conversation.botId,
        conversationId: conversation.id,
        name: validName ? name : null,
        email: validEmail ? email : null,
        phone: validPhone ? phone : null,
        status: "NEW",
        score: scoreResult.score,
        temperature: scoreResult.temperature,
        scoreReasons: scoreResult.reasons,
      },
      select: { publicId: true }
    });

    await prisma.dataEvent.create({
      data: {
        organizationId: conversation.organizationId,
        workspaceId: conversation.workspaceId,
        botId: conversation.botId,
        conversationId: conversation.id,
        type: "LEAD_SCORED",
        topic: "GENERAL",
        payload: {
          leadPublicId: lead.publicId,
          score: scoreResult.score,
          temperature: scoreResult.temperature,
          reasons: scoreResult.reasons,
        },
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: "Thanks! We'll be in touch shortly."
      }
    });

    notifyNewLead({
      leadPublicId: lead.publicId,
      orgId: conversation.organizationId,
      botId: conversation.botId,
      name: validName ? name : null,
      email: validEmail ? email : null,
      phone: validPhone ? phone : null,
      source: "widget",
    }).catch((err) => {
      console.error("[LEAD_NOTIFICATION_ERROR]", err);
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
