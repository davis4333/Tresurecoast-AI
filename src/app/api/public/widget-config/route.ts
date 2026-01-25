import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { isHostAllowed, getRequestHost, getOriginHost, enforceTenantBinding } from "@/lib/public/hostPolicy";
import { checkRateLimit } from "@/lib/public/rateLimit";

export const runtime = "nodejs";

function methodNotAllowed() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const botPublicKey = url.searchParams.get("botPublicKey");

  if (!botPublicKey || !isValidUUID(botPublicKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid bot key" },
      { status: 400 }
    );
  }

  const rateLimitCheck = await checkRateLimit(req, "widget_config", botPublicKey);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: rateLimitCheck.error || "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try{
    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: {
        publicKey: true,
        status: true,
        name: true,
        greeting: true,
        fallbackText: true,
        organizationId: true,
        allowlist: { select: { domain: true } },
        organization: {
          select: {
            whiteLabelEnabled: true,
            brandCompanyName: true,
            brandLogoUrl: true,
            brandPrimaryColor: true,
            showPoweredBy: true,
          }
        }
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

    const greeting = bot.greeting?.trim() || "How can I help?";
    const fallbackText =
      bot.fallbackText?.trim() ||
      "I'm not 100% sure from the info I have. Want to leave your name and number so the team can follow up?";

    const org = bot.organization;

    return NextResponse.json({
      ok: true,
      config: {
        botPublicKey: bot.publicKey,
        name: bot.name || null,
        greeting,
        fallbackText,
        theme: {
          mode: "dark",
          accent: null
        },
        branding: {
          whiteLabelEnabled: org.whiteLabelEnabled,
          brandCompanyName: org.brandCompanyName,
          brandLogoUrl: org.brandLogoUrl,
          brandPrimaryColor: org.brandPrimaryColor,
          showPoweredBy: org.showPoweredBy,
        }
      }
    });
  } catch (error) {
    console.error("[WIDGET CONFIG ERROR]", error);
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
