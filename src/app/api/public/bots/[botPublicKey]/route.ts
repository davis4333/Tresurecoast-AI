import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { botPublicKey: string } }
) {
  const botPublicKey = params?.botPublicKey;

  // Validate key presence + format (must be UUID)
  if (!isValidUUID(botPublicKey)) {
    return NextResponse.json({ ok: false, error: "Invalid bot key" }, { status: 400 });
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
