import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUUID } from "@/lib/public/uuid";
import { BotUpdateSchema } from "@/lib/public/zodSchemas";
import { requireClerkAdmin, ClerkUnauthorizedError, handleClerkError } from "@/lib/admin/requireClerkAdmin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ botPublicKey: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    await requireClerkAdmin();
  } catch (error) {
    if (error instanceof ClerkUnauthorizedError) {
      return error.response;
    }
    return handleClerkError(error);
  }

  try {
    const { botPublicKey } = await context.params;

    if (!botPublicKey || !isValidUUID(botPublicKey)) {
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
        organization: { select: { name: true, publicId: true } },
        workspace: { select: { name: true, publicId: true } },
        links: {
          select: {
            id: true,
            type: true,
            label: true,
            url: true
          },
          orderBy: { createdAt: "asc" }
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
        publicKey: bot.publicKey,
        name: bot.name,
        status: bot.status,
        greeting: bot.greeting,
        fallbackText: bot.fallbackText,
        businessPhone: bot.businessPhone,
        businessEmail: bot.businessEmail,
        businessAddress: bot.businessAddress,
        hours: bot.hours,
        services: bot.services,
        links: bot.links,
        createdAt: bot.createdAt.toISOString(),
        updatedAt: bot.updatedAt.toISOString(),
        organizationName: bot.organization.name,
        workspaceName: bot.workspace.name
      }
    });
  } catch (error) {
    console.error("[ADMIN BOT GET ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    await requireClerkAdmin();
  } catch (error) {
    if (error instanceof ClerkUnauthorizedError) {
      return error.response;
    }
    return handleClerkError(error);
  }

  try {
    const { botPublicKey } = await context.params;

    if (!botPublicKey || !isValidUUID(botPublicKey)) {
      return NextResponse.json(
        { ok: false, error: "Invalid bot key" },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = BotUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        { ok: false, error: messages.join(", ") },
        { status: 400 }
      );
    }

    const { links, ...updateData } = parsed.data;

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: { id: true }
    });

    if (!bot) {
      return NextResponse.json(
        { ok: false, error: "Bot not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const dataToUpdate: Record<string, unknown> = {};

      if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
      if (updateData.greeting !== undefined) dataToUpdate.greeting = updateData.greeting;
      if (updateData.fallbackText !== undefined) dataToUpdate.fallbackText = updateData.fallbackText;
      if (updateData.businessPhone !== undefined) dataToUpdate.businessPhone = updateData.businessPhone;
      if (updateData.businessEmail !== undefined) dataToUpdate.businessEmail = updateData.businessEmail;
      if (updateData.businessAddress !== undefined) dataToUpdate.businessAddress = updateData.businessAddress;
      if (updateData.hours !== undefined) dataToUpdate.hours = updateData.hours;
      if (updateData.services !== undefined) dataToUpdate.services = updateData.services;

      if (Object.keys(dataToUpdate).length > 0) {
        await tx.bot.update({
          where: { id: bot.id },
          data: dataToUpdate
        });
      }

      if (links !== undefined) {
        await tx.botLink.deleteMany({
          where: { botId: bot.id }
        });

        if (links.length > 0) {
          await tx.botLink.createMany({
            data: links.map((link) => ({
              botId: bot.id,
              type: link.type,
              label: link.label,
              url: link.url
            }))
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN BOT PATCH ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { ok: false, error: "Method not allowed" },
    { status: 405 }
  );
}
