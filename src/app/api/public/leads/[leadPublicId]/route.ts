import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";
import { checkRateLimit } from "@/lib/public/rateLimit";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ leadPublicId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const botPublicKey = searchParams.get("botPublicKey");

    const { leadPublicId } = await context.params;

    if (!botPublicKey || !isValidUUID(botPublicKey)) {
      return NextResponse.json(
        { ok: false, error: "Invalid bot key" },
        { status: 400 }
      );
    }

    if (!leadPublicId || !isValidUUID(leadPublicId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

    const rateLimitCheck = await checkRateLimit(request, "lead_detail", botPublicKey);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.error || "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        status: true,
        organizationId: true,
        allowlist: { select: { domain: true } },
      },
    });

    if (!bot) {
      return NextResponse.json(
        { ok: false, error: "Bot not found" },
        { status: 404 }
      );
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "Bot is not active" },
        { status: 403 }
      );
    }

    const allowlistDomains = bot.allowlist
      .map((a) => a.domain)
      .filter((d): d is string => typeof d === "string" && d.length > 0);

    const origin = request.headers.get("origin");
    const originHost = getOriginHost(request);
    const host = getRequestHost(request);

    if (!isHostAllowed(allowlistDomains, originHost ?? origin, host)) {
      return NextResponse.json(
        { ok: false, error: "Origin not allowed" },
        { status: 403 }
      );
    }

    const bind = await enforceTenantBinding({ req: request, botOrgId: bot.organizationId });
    if (!bind.ok) {
      return NextResponse.json(
        { ok: false, error: bind.error, message: bind.message },
        { status: bind.status }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        publicId: leadPublicId,
        botId: bot.id,
      },
      select: {
        publicId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        score: true,
        temperature: true,
        scoreReasons: true,
        createdAt: true,
        conversation: {
          select: {
            publicId: true,
          },
        },
      },
    });

    if (!lead || !lead.conversation) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        lead: {
          leadPublicId: lead.publicId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          score: lead.score,
          temperature: lead.temperature,
          scoreReasons: lead.scoreReasons,
          createdAt: lead.createdAt.toISOString(),
          conversationPublicId: lead.conversation.publicId,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[LEAD DETAIL ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}
