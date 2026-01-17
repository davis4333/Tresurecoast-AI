import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * DEV-ONLY seed endpoint.
 * Requires header: x-admin-seed-key matching env var ADMIN_SEED_KEY.
 *
 * IDEMPOTENT by default:
 * - Checks for existing seed via AuditLog marker "[SEED_V1 orgId=X wsId=Y botId=Z]"
 * - Returns existing org/workspace/bot IDs if found (always returns latest seed)
 * - Creates new seed only if none exists OR if header x-seed-force = "true"
 */

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: Request) {
  const headerKey = req.headers.get("x-admin-seed-key");
  const envKey = process.env.ADMIN_SEED_KEY;

  if (!envKey) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_SEED_KEY is not set in environment." },
      { status: 500 }
    );
  }

  if (!headerKey || headerKey !== envKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized seed attempt." }, { status: 401 });
  }

  const forceCreate = req.headers.get("x-seed-force") === "true";

  const body = (await req.json().catch(() => ({}))) as Partial<{
    orgName: string;
    workspaceName: string;
    botName: string;
    bookingUrl: string;
    paymentUrl: string;
  }>;

  const orgName = body.orgName?.trim() || "Treasure Coast AI Demo";
  const workspaceName = body.workspaceName?.trim() || "Default Workspace";
  const botName = body.botName?.trim() || "Starter Bot";

  const bookingUrl = body.bookingUrl?.trim() || "https://example.com/book";
  const paymentUrl = body.paymentUrl?.trim() || "https://example.com/pay";

  try {
    if (!forceCreate) {
      const existingSeed = await prisma.auditLog.findFirst({
        where: {
          action: "ORG_CREATED",
          summary: { contains: "[SEED_V1" }
        },
        orderBy: { createdAt: "desc" },
        select: { summary: true }
      });

      if (existingSeed) {
        const match = existingSeed.summary.match(/\[SEED_V1 orgId=(\d+) wsId=(\d+) botId=(\d+)\]/);

        if (match && match[1] && match[2] && match[3]) {
          const orgId = parseInt(match[1], 10);
          const wsId = parseInt(match[2], 10);
          const botId = parseInt(match[3], 10);

          const org = await prisma.organization.findUnique({
            where: { id: orgId },
            select: { publicId: true }
          });

          const ws = await prisma.workspace.findUnique({
            where: { id: wsId },
            select: { publicId: true, organizationId: true }
          });

          const bot = await prisma.bot.findUnique({
            where: { id: botId },
            select: { publicKey: true, organizationId: true, workspaceId: true }
          });

          if (
            org &&
            ws &&
            bot &&
            ws.organizationId === orgId &&
            bot.organizationId === orgId &&
            bot.workspaceId === wsId
          ) {
            return NextResponse.json({
              ok: true,
              orgPublicId: org.publicId,
              workspacePublicId: ws.publicId,
              botPublicKey: bot.publicKey,
              note: "Existing seed returned (use x-seed-force: true to create new)"
            });
          }
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name: orgName } });

      const ws = await tx.workspace.create({
        data: {
          organizationId: org.id,
          name: workspaceName
        }
      });

      const bot = await tx.bot.create({
        data: {
          organizationId: org.id,
          workspaceId: ws.id,
          name: botName,
          greeting: "Hey! What can I help you with today?",
          fallbackText:
            "I'm not 100% sure from the info I have. Want to leave your name and number so the team can follow up?"
        }
      });

      await tx.botLink.createMany({
        data: [
          { botId: bot.id, type: "BOOKING", label: "Book Now", url: bookingUrl },
          { botId: bot.id, type: "PAYMENT", label: "Pay Deposit", url: paymentUrl }
        ]
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          workspaceId: ws.id,
          action: "ORG_CREATED",
          summary: `[SEED_V1 orgId=${org.id} wsId=${ws.id} botId=${bot.id}] Seeded demo org/workspace/bot via /api/admin/seed`,
          actorId: null
        }
      });

      return { org, ws, bot };
    });

    return NextResponse.json({
      ok: true,
      orgPublicId: result.org.publicId,
      workspacePublicId: result.ws.publicId,
      botPublicKey: result.bot.publicKey
    });
  } catch (error) {
    console.error("[SEED ERROR]", error);

    return NextResponse.json({ ok: false, error: "Internal error creating seed data." }, { status: 500 });
  }
}
