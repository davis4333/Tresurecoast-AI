import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { botPublicKey: string } }
) {
  const botPublicKey = params?.botPublicKey;

  // Validate key presence + format (must be UUID)
  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json({ ok: false, error: "Invalid bot key" }, { status: 400 });
  }

  const rateLimitCheck = await checkRateLimit(request, "bot_fetch", botPublicKey);
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
        publicKey: true,
        name: true,
        status: true,
        greeting: true,
        fallbackText: true,
        organizationId: true,
        organization: {
          select: {
            publicId: true,
            name: true,
          },
        },
        workspace: {
          select: {
            publicId: true,
            name: true,
          },
        },
        links: {
          select: {
            type: true,
            label: true,
            url: true,
          },
          orderBy: { createdAt: "asc" },
        },
        allowlist: {
          select: {
            domain: true,
          },
        },
      },
    });

    if (!bot) {
      return NextResponse.json({ ok: false, error: "Bot not found" }, { status: 404 });
    }

    if (bot.status !== "ACTIVE") {
      return NextResponse.json({ ok: false, error: "Bot not active" }, { status: 404 });
    }

    // Host allowlist check
    const allowlistDomains = bot.allowlist
      .map((a) => a.domain)
      .filter((d): d is string => typeof d === "string" && d.trim().length > 0);

    const origin = request.headers.get("origin");
    const originHost = getOriginHost(request);
    const host = getRequestHost(request);

    if (!isHostAllowed(allowlistDomains, originHost ?? origin, host)) {
      console.warn("[bot-fetch] Blocked request from unauthorized domain", {
        botPublicKey,
        origin,
        host,
      });
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Tenant binding check
    const bind = await enforceTenantBinding({ req: request, botOrgId: bot.organizationId });
    if (!bind.ok) {
      return NextResponse.json(
        { ok: false, error: bind.error, message: bind.message },
        { status: bind.status }
      );
    }

    return NextResponse.json({
      ok: true,
      bot: {
        botPublicKey: bot.publicKey,
        name: bot.name,
        greeting: bot.greeting,
        fallbackText: bot.fallbackText,
        orgPublicId: bot.organization.publicId,
        orgName: bot.organization.name,
        workspacePublicId: bot.workspace.publicId,
        workspaceName: bot.workspace.name,
        links: bot.links,
        domainAllowlist: bot.allowlist.map((a) => a.domain),
      },
    });
  } catch (error) {
    console.error("[PUBLIC BOT FETCH ERROR]", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
