import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["NEW", "CONTACTED", "BOOKED", "CLOSED"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

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

interface PatchBody {
  botPublicKey?: unknown;
  leadPublicId?: unknown;
  status?: unknown;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const host = request.headers.get("host")?.split(":")[0] || null;

    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { botPublicKey, leadPublicId, status } = body;

    if (
      typeof botPublicKey !== "string" ||
      !botPublicKey ||
      !isValidUUID(botPublicKey)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid bot key" },
        { status: 400 }
      );
    }

    if (
      typeof leadPublicId !== "string" ||
      !leadPublicId ||
      !isValidUUID(leadPublicId)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid lead id" },
        { status: 400 }
      );
    }

    if (
      typeof status !== "string" ||
      !status ||
      !ALLOWED_STATUSES.includes(status as AllowedStatus)
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid status. Must be NEW, CONTACTED, BOOKED, or CLOSED" },
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

    const updated = await prisma.lead.updateMany({
      where: {
        publicId: leadPublicId,
        botId: bot.id,
      },
      data: {
        status: status as AllowedStatus,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { ok: false, error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[LEAD STATUS UPDATE ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
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

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}
