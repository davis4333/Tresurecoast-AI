import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const botPublicKey = url.searchParams.get("botPublicKey");

  try {
    if (botPublicKey) {
      if (!isValidUUID(botPublicKey)) {
        return NextResponse.json(
          { ok: false, error: "Invalid bot key" },
          { status: 400 }
        );
      }

      const bot = await prisma.bot.findUnique({
        where: { publicKey: botPublicKey },
        select: {
          publicKey: true,
          name: true,
          status: true,
          greeting: true,
          fallbackText: true,
          businessPhone: true,
          businessEmail: true,
          businessAddress: true,
          hours: true,
          services: true,
          createdAt: true,
          updatedAt: true,
          organization: { select: { name: true } },
          workspace: { select: { name: true } },
          links: {
            select: {
              id: true,
              type: true,
              label: true,
              url: true
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

      return NextResponse.json({
        ok: true,
        bot: {
          ...bot,
          organizationName: bot.organization.name,
          workspaceName: bot.workspace.name
        }
      });
    }

    const bots = await prisma.bot.findMany({
      select: {
        publicKey: true,
        name: true,
        status: true,
        createdAt: true,
        organization: { select: { name: true } },
        workspace: { select: { name: true } },
        _count: {
          select: {
            leads: true,
            conversations: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    return NextResponse.json({
      ok: true,
      bots: bots.map((b) => ({
        publicKey: b.publicKey,
        name: b.name,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
        organizationName: b.organization.name,
        workspaceName: b.workspace.name,
        leadsCount: b._count.leads,
        conversationsCount: b._count.conversations
      }))
    });
  } catch (error) {
    console.error("[ADMIN BOTS LIST ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}
