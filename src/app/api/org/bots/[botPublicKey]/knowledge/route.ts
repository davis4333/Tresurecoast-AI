import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin, getTestUserId } from "@/lib/auth/getOrgContext";
import { CreateKnowledgeSourceSchema } from "@/lib/truthMode/schemas";
import { isValidUuid } from "@/lib/public/uuid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getBotByPublicKey(botPublicKey: string, organizationId: number) {
  if (!isValidUuid(botPublicKey)) {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botPublicKey: string }> }
) {
  try {
    const { botPublicKey } = await params;
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

    const sources = await prisma.botKnowledgeSource.findMany({
      where: { botId: bot.id, organizationId: ctx.org.id },
      select: { id: true, title: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      sources: sources.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[knowledge/GET] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to fetch knowledge sources" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botPublicKey: string }> }
) {
  try {
    const { botPublicKey } = await params;
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

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "invalid_body", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = CreateKnowledgeSourceSchema.safeParse(body);
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

    await prisma.botKnowledgeSource.upsert({
      where: { contentHash },
      create: {
        botId: bot.id,
        organizationId: ctx.org.id,
        type: "PASTE",
        title,
        content,
        contentHash,
      },
      update: {
        title,
        updatedAt: new Date(),
      },
    });

    const sources = await prisma.botKnowledgeSource.findMany({
      where: { botId: bot.id, organizationId: ctx.org.id },
      select: { id: true, title: true, type: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      sources: sources.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        createdAt: s.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[knowledge/POST] Error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to save knowledge source" },
      { status: 500 }
    );
  }
}
