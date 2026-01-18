import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { LeadStatusPatchSchema } from "@/lib/public/zodSchemas";
import { scoreLead } from "@/lib/leads/scoreLead";

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

function invalidStatus() {
  return NextResponse.json(
    {
      ok: false,
      error: "Invalid status. Must be NEW, CONTACTED, BOOKED, or CLOSED"
    },
    { status: 400 }
  );
}

export async function PATCH(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = LeadStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message);

    if (messages.includes("Invalid bot key")) {
      return NextResponse.json(
        { ok: false, error: "Invalid bot key" },
        { status: 400 }
      );
    }

    if (messages.includes("Invalid lead id")) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

    return invalidStatus();
  }

  const { botPublicKey, leadPublicId, status } = parsed.data;

  const rl = await checkRateLimit(req, "leads_status", botPublicKey);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: rl.error || "Rate limit exceeded" },
      { status: 429 }
    );
  }

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

    const existingLead = await prisma.lead.findFirst({
      where: {
        publicId: leadPublicId,
        botId: bot.id
      },
      select: {
        id: true,
        publicId: true,
        name: true,
        email: true,
        phone: true,
        organizationId: true,
        workspaceId: true,
        conversationId: true,
      }
    });

    if (!existingLead) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    const scoreInput = {
      lead: {
        name: existingLead.name,
        email: existingLead.email,
        phone: existingLead.phone,
      },
      signals: {},
    };

    const scoreResult = scoreLead(scoreInput);

    await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        status,
        score: scoreResult.score,
        temperature: scoreResult.temperature,
        scoreReasons: scoreResult.reasons,
      }
    });

    await prisma.dataEvent.create({
      data: {
        organizationId: existingLead.organizationId,
        workspaceId: existingLead.workspaceId,
        botId: bot.id,
        conversationId: existingLead.conversationId,
        type: "LEAD_SCORED",
        topic: "GENERAL",
        payload: {
          leadPublicId: existingLead.publicId,
          score: scoreResult.score,
          temperature: scoreResult.temperature,
          reasons: scoreResult.reasons,
          trigger: "status_update",
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LEAD STATUS UPDATE ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return methodNotAllowed();
}
export async function POST() {
  return methodNotAllowed();
}
export async function PUT() {
  return methodNotAllowed();
}
export async function DELETE() {
  return methodNotAllowed();
}
export async function OPTIONS() {
  return methodNotAllowed();
}
