import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext, isAdmin } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { isValidUUID } from '@/lib/public/uuid';

export const dynamic = 'force-dynamic';

const updateBotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  greeting: z.string().optional(),
  fallbackText: z.string().optional(),
  businessPhone: z.string().optional(),
  businessEmail: z.string().email().optional(),
  businessAddress: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});

/**
 * GET /api/org/bots/[botPublicKey]
 * Get bot detail with full information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ botPublicKey: string }> }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  try {
    const { botPublicKey } = await params;

    if (!isValidUUID(botPublicKey)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_key', message: 'Invalid bot key' },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        links: true,
        allowlist: true,
        _count: {
          select: {
            knowledgeSources: true,
            leads: true,
            conversations: true,
          },
        },
      },
    });

    if (!bot || bot.organizationId !== ctx.org.id) {
      return NextResponse.json(
        { ok: false, error: 'not_found', message: 'Bot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      bot: {
        id: bot.id,
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
        workspace: bot.workspace,
        links: bot.links,
        allowlist: bot.allowlist,
        counts: {
          knowledgeSources: bot._count.knowledgeSources,
          conversations: bot._count.conversations,
          leads: bot._count.leads,
        },
        createdAt: bot.createdAt.toISOString(),
        updatedAt: bot.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[bots/[botPublicKey]/GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to fetch bot' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/org/bots/[botPublicKey]
 * Update bot information
 * Requires: OWNER/ADMIN, or CLIENT with allowClientEdits=true
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ botPublicKey: string }> }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  try {
    const { botPublicKey } = await params;

    if (!isValidUUID(botPublicKey)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_key', message: 'Invalid bot key' },
        { status: 400 }
      );
    }

    // Check RBAC: CLIENT can only update if allowClientEdits is enabled
    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id },
      select: { allowClientEdits: true },
    });

    if (ctx.role === 'CLIENT' && !org?.allowClientEdits) {
      return NextResponse.json(
        { ok: false, error: 'forbidden', message: 'Insufficient permissions to update bot' },
        { status: 403 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: { id: true, organizationId: true, name: true },
    });

    if (!bot || bot.organizationId !== ctx.org.id) {
      return NextResponse.json(
        { ok: false, error: 'not_found', message: 'Bot not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'invalid_body', message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = updateBotSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'validation_error',
          message: 'Invalid data',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updatedBot = await prisma.bot.update({
      where: { id: bot.id },
      data: validation.data,
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.org.id,
        action: 'BOT_UPDATED',
        summary: `Bot "${bot.name}" updated`,
        actorId: ctx.userId,
      },
    });

    return NextResponse.json({
      ok: true,
      bot: {
        id: updatedBot.id,
        publicKey: updatedBot.publicKey,
        name: updatedBot.name,
        status: updatedBot.status,
        greeting: updatedBot.greeting,
        fallbackText: updatedBot.fallbackText,
        businessPhone: updatedBot.businessPhone,
        businessEmail: updatedBot.businessEmail,
        businessAddress: updatedBot.businessAddress,
        updatedAt: updatedBot.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[bots/[botPublicKey]/PUT] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to update bot' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/bots/[botPublicKey]
 * Archive bot (soft delete)
 * Requires: OWNER or ADMIN role (CLIENT cannot archive)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ botPublicKey: string }> }
) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  // Only OWNER and ADMIN can archive bots
  if (ctx.role === 'CLIENT') {
    return NextResponse.json(
      { ok: false, error: 'forbidden', message: 'Insufficient permissions to archive bots' },
      { status: 403 }
    );
  }

  try {
    const { botPublicKey } = await params;

    if (!isValidUUID(botPublicKey)) {
      return NextResponse.json(
        { ok: false, error: 'invalid_key', message: 'Invalid bot key' },
        { status: 400 }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { publicKey: botPublicKey },
      select: { id: true, organizationId: true, name: true },
    });

    if (!bot || bot.organizationId !== ctx.org.id) {
      return NextResponse.json(
        { ok: false, error: 'not_found', message: 'Bot not found' },
        { status: 404 }
      );
    }

    await prisma.bot.update({
      where: { id: bot.id },
      data: { status: 'ARCHIVED' },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.org.id,
        action: 'BOT_ARCHIVED',
        summary: `Bot "${bot.name}" archived`,
        actorId: ctx.userId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Bot archived successfully',
    });
  } catch (error) {
    console.error('[bots/[botPublicKey]/DELETE] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to archive bot' },
      { status: 500 }
    );
  }
}
