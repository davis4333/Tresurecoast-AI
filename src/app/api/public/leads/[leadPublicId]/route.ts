import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

function isHostAllowed(
  allowlist: string[],
  host: string | null
): boolean {
  const filtered = allowlist
    .map((d) => d.trim().toLowerCase())
    .filter((d) => d.length > 0);
  if (filtered.length === 0) return true;
  if (!host) return false;
  const normalizedHost = host.toLowerCase();
  return filtered.some(
    (d) => normalizedHost === d || normalizedHost.endsWith(`.${d}`)
  );
}

interface RouteContext {
  params: Promise<{ leadPublicId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const host = request.headers.get("host")?.split(":")[0] || null;
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

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        id: true,
        status: true,
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

    if (!isHostAllowed(allowlistDomains, host)) {
      return NextResponse.json(
        { ok: false, error: "Origin not allowed" },
        { status: 403 }
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
