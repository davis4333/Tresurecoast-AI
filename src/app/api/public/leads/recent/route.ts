import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["NEW", "CONTACTED", "BOOKED", "CLOSED"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const botPublicKey = url.searchParams.get("botPublicKey");
  const limitParam = url.searchParams.get("limit");
  const cursorParam = url.searchParams.get("cursor");
  const statusParam = url.searchParams.get("status");

  if (!botPublicKey || !isValidUUID(botPublicKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid bot key" },
      { status: 400 }
    );
  }

  let limit = 25;
  if (limitParam) {
    const parsed = Number.parseInt(limitParam, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
      return NextResponse.json(
        { ok: false, error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }
    limit = parsed;
  }

  let status: AllowedStatus | null = null;
  if (statusParam) {
    if (!ALLOWED_STATUSES.includes(statusParam as AllowedStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid status. Must be NEW, CONTACTED, BOOKED, or CLOSED" },
        { status: 400 }
      );
    }
    status = statusParam as AllowedStatus;
  }

  let cursorDate: Date | null = null;
  if (cursorParam) {
    const parsed = new Date(cursorParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid cursor" },
        { status: 400 }
      );
    }
    cursorDate = parsed;
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

    const where: Prisma.LeadWhereInput = {
      botId: bot.id,
      status: status ? (status as any) : ({ in: ALLOWED_STATUSES as any } as any)
    };

    if (cursorDate) {
      where.createdAt = { lt: cursorDate };
    }

    const dbLeads = await prisma.lead.findMany({
      where,
      select: {
        publicId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        conversation: {
          select: {
            publicId: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1
    });

    const hasMore = dbLeads.length > limit;
    const leads = hasMore ? dbLeads.slice(0, limit) : dbLeads;

    let nextCursor: string | null = null;
    if (hasMore && leads.length > 0) {
      const lastLead = leads[leads.length - 1];
      if (lastLead) {
        nextCursor = lastLead.createdAt.toISOString();
      }
    }

    const result = leads
      .filter((lead) =>
        ALLOWED_STATUSES.includes(String(lead.status) as AllowedStatus)
      )
      .map((lead) => ({
        leadPublicId: lead.publicId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        status: String(lead.status) as AllowedStatus,
        createdAt: lead.createdAt.toISOString(),
        conversationPublicId: lead.conversation?.publicId || null
      }));

    return NextResponse.json({
      ok: true,
      leads: result,
      nextCursor
    });
  } catch (error) {
    console.error("[LEADS RECENT ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return methodNotAllowed();
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
