import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { ChatRequestSchema } from "@/lib/public/zodSchemas";
import { runTruthEngine, type BotLinkData } from "@/lib/truth/truthEngine";

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

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }

  const { botPublicKey, conversationPublicId, message } = parsed.data;

  const rateLimitCheck = await checkRateLimit(req, "chat", botPublicKey);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimitCheck.error || "Rate limit exceeded" },
      { status: 429 }
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
        name: true,
        greeting: true,
        fallbackText: true,
        businessPhone: true,
        businessEmail: true,
        businessAddress: true,
        hours: true,
        services: true,
        allowlist: { select: { domain: true } },
        links: {
          select: {
            type: true,
            label: true,
            url: true,
          },
        },
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

    let conversation: { id: number; publicId: string } | null = null;

    if (conversationPublicId) {
      conversation = await prisma.conversation.findFirst({
        where: { publicId: conversationPublicId, botId: bot.id },
        select: { id: true, publicId: true },
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          organizationId: bot.organizationId,
          workspaceId: bot.workspaceId,
          botId: bot.id,
        },
        select: { id: true, publicId: true },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    const truthResult = runTruthEngine({
      userMessage: message,
      bot: {
        name: bot.name,
        greeting: bot.greeting,
        fallbackText: bot.fallbackText,
        businessPhone: bot.businessPhone,
        businessEmail: bot.businessEmail,
        businessAddress: bot.businessAddress,
        hours: bot.hours,
        services: bot.services,
        links: bot.links as BotLinkData[],
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: truthResult.reply,
      },
    });

    if (truthResult.missingData && truthResult.missingDataTopics.length > 0) {
      try {
        await prisma.missingDataEvent.create({
          data: {
            organizationId: bot.organizationId,
            workspaceId: bot.workspaceId,
            botId: bot.id,
            conversationId: conversation.id,
            topics: truthResult.missingDataTopics,
            userMessage: message,
          },
        });
      } catch (logError) {
        console.error("[MISSING DATA LOG ERROR]", logError);
      }
    }

    let leadCaptureRequested = truthResult.leadCaptureRequested;

    if (leadCaptureRequested) {
      const existingLead = await prisma.lead.findFirst({
        where: { conversationId: conversation.id },
        select: { id: true },
      });

      if (existingLead) {
        leadCaptureRequested = false;
      }
    }

    return NextResponse.json({
      ok: true,
      conversationPublicId: conversation.publicId,
      message: truthResult.reply,
      leadCaptureRequested,
      externalRedirectUrl: truthResult.externalRedirectUrl,
      sourcedFrom: truthResult.sourcedFrom,
      missingData: truthResult.missingData,
      missingDataTopics: truthResult.missingDataTopics,
    });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
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
