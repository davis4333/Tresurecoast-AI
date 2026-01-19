import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin, getTestUserId } from "@/lib/auth/getOrgContext";
import { isValidUUID } from "@/lib/public/uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getBotByPublicKey(botPublicKey: string, organizationId: number) {
  if (!isValidUUID(botPublicKey)) {
    return null;
  }
  return prisma.bot.findFirst({
    where: { publicKey: botPublicKey, organizationId },
    select: { id: true, organizationId: true },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ botPublicKey: string; sourceId: string }> }
) {
  try {
    const { botPublicKey, sourceId } = await params;
    const testUserId = getTestUserId(request);
    const ctx = await getOrgContext({ request, testUserId });

    if (!ctx.ok) {
      return NextResponse.json(
        { ok: false, error: ctx.error, message: ctx.message },
        { status: ctx.status }
      );
    }

    if (!isAdmin(ctx.role)) {
      return NextResponse.json(
        { ok: false, error: "forbidden", message: "Admin access required" },
        { status: 403 }
      );
    }

    const bot = await getBotByPublicKey(botPublicKey, ctx.org.id);
    if (!bot) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Bot not found" },
        { status: 404 }
      );
    }

    const sourceIdNum = parseInt(sourceId, 10);
    if (isNaN(sourceIdNum)) {
      return NextResponse.json(
        { ok: false, error: "invalid_id", message: "Invalid source ID" },
        { status: 400 }
      );
    }

    const source = await prisma.botKnowledgeSource.findFirst({
      where: {
        id: sourceIdNum,
        botId: bot.id,
        organizationId: ctx.org.id,
      },
    });

    if (!source) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Knowledge source not found" },
        { status: 404 }
      );
    }

    await prisma.botKnowledgeSource.delete({
      where: { id: source.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[knowledge/DELETE] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to delete knowledge source" },
      { status: 500 }
    );
  }
}
