import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin, getTestUserId } from "@/lib/auth/getOrgContext";
import { isValidUUID } from "@/lib/public/uuid";
import { z } from "zod";

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

function computeContentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

const UpdateKnowledgeSourceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .transform((s) => s.trim()),
  content: z
    .string()
    .min(100, "Content must be at least 100 characters")
    .max(50000, "Content must be 50,000 characters or less")
    .transform((s) => s.trim()),
});

export async function GET(
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
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!source) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Knowledge source not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: {
        id: source.id,
        title: source.title,
        content: source.content,
        type: source.type,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[knowledge/sourceId/GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to fetch knowledge source" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const existingSource = await prisma.botKnowledgeSource.findFirst({
      where: {
        id: sourceIdNum,
        botId: bot.id,
        organizationId: ctx.org.id,
      },
    });

    if (!existingSource) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Knowledge source not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "invalid_body", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = UpdateKnowledgeSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid data",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { title, content } = parsed.data;
    const contentHash = computeContentHash(content);

    const duplicateSource = await prisma.botKnowledgeSource.findFirst({
      where: {
        botId: bot.id,
        contentHash,
        id: { not: sourceIdNum },
      },
    });

    if (duplicateSource) {
      return NextResponse.json(
        {
          ok: false,
          error: "duplicate_content",
          message: "A knowledge source with this content already exists",
        },
        { status: 409 }
      );
    }

    const updatedSource = await prisma.botKnowledgeSource.update({
      where: { id: sourceIdNum },
      data: {
        title,
        content,
        contentHash,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      source: {
        id: updatedSource.id,
        title: updatedSource.title,
        content: updatedSource.content,
        type: updatedSource.type,
        createdAt: updatedSource.createdAt.toISOString(),
        updatedAt: updatedSource.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[knowledge/sourceId/PUT] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to update knowledge source" },
      { status: 500 }
    );
  }
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
