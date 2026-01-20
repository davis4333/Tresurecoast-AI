import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isOwner, getTestUserId } from "@/lib/auth/getOrgContext";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEMO_RESET_ENABLED = process.env.DEMO_RESET_ENABLED === "true";

const DemoResetSchema = z.object({
  confirmText: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    if (IS_PRODUCTION && !DEMO_RESET_ENABLED) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "Demo reset is not available in production",
        },
        { status: 403 }
      );
    }

    const ctx = await getOrgContext({ testUserId: getTestUserId(req) });

    if (!ctx.ok) {
      return NextResponse.json(
        { ok: false, error: ctx.error, message: ctx.message },
        { status: ctx.status }
      );
    }

    if (!isOwner(ctx.role)) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "Only organization owners can reset demo data",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = DemoResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid request body",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    if (parsed.data.confirmText !== "RESET DEMO") {
      return NextResponse.json(
        {
          ok: false,
          error: "confirmation_mismatch",
          message: 'You must type "RESET DEMO" to confirm',
        },
        { status: 400 }
      );
    }

    const orgId = ctx.org.id;

    const workspace = await prisma.workspace.findFirst({
      where: { organizationId: orgId },
      select: { id: true },
    });

    const deleted = await prisma.$transaction(async (tx) => {
      const leadsDeleted = await tx.lead.deleteMany({
        where: { organizationId: orgId },
      });

      const conversationsDeleted = await tx.conversation.deleteMany({
        where: { organizationId: orgId },
      });

      const dataEventsDeleted = await tx.dataEvent.deleteMany({
        where: { organizationId: orgId },
      });

      const notificationLogsDeleted = await tx.notificationLog.deleteMany({
        where: { organizationId: orgId },
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgId,
          workspaceId: workspace?.id ?? null,
          action: "DEMO_RESET",
          summary: `Demo reset triggered by user ${ctx.userId}. Deleted: ${leadsDeleted.count} leads, ${conversationsDeleted.count} conversations, ${dataEventsDeleted.count} data events, ${notificationLogsDeleted.count} notification logs.`,
          actorId: ctx.userId,
        },
      });

      return {
        leads: leadsDeleted.count,
        conversations: conversationsDeleted.count,
        dataEvents: dataEventsDeleted.count,
        notificationLogs: notificationLogsDeleted.count,
      };
    });

    return NextResponse.json({
      ok: true,
      deleted,
      seeded: false,
    });
  } catch (error) {
    console.error("[API] POST /api/org/demo-reset error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to reset demo data" },
      { status: 500 }
    );
  }
}
