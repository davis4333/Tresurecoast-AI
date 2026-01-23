import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext, isAdmin } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkBotLimit } from '@/lib/plans/enforcement';

export const dynamic = 'force-dynamic';

const createBotSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  workspaceId: z.number().optional(),
  greeting: z.string().optional(),
  fallbackText: z.string().optional(),
});

/**
 * GET /api/org/bots
 * List all bots for the authenticated organization
 */
export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  try {
    const bots = await prisma.bot.findMany({
      where: {
        organizationId: ctx.org.id,
        status: { not: 'ARCHIVED' }, // Exclude archived bots
      },
      select: {
        id: true,
        publicKey: true,
        name: true,
        status: true,
        greeting: true,
        fallbackText: true,
        businessPhone: true,
        businessEmail: true,
        businessAddress: true,
        createdAt: true,
        updatedAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            knowledgeSources: true,
            conversations: true,
            leads: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      bots: bots.map((bot) => ({
        id: bot.id,
        publicKey: bot.publicKey,
        name: bot.name,
        status: bot.status,
        greeting: bot.greeting,
        fallbackText: bot.fallbackText,
        businessPhone: bot.businessPhone,
        businessEmail: bot.businessEmail,
        businessAddress: bot.businessAddress,
        workspace: bot.workspace,
        counts: {
          knowledgeSources: bot._count.knowledgeSources,
          conversations: bot._count.conversations,
          leads: bot._count.leads,
        },
        createdAt: bot.createdAt.toISOString(),
        updatedAt: bot.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[bots/GET] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to fetch bots' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/org/bots
 * Create a new bot
 * Requires: OWNER or ADMIN role (CLIENT cannot create bots)
 */
export async function POST(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  // Only OWNER and ADMIN can create bots
  if (ctx.role === 'CLIENT') {
    return NextResponse.json(
      { ok: false, error: 'forbidden', message: 'Insufficient permissions to create bots' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'invalid_body', message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = createBotSchema.safeParse(body);
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

    const { name, workspaceId, greeting, fallbackText } = validation.data;

    // Check plan limits - enforce bot creation limits
    const limitCheck = await checkBotLimit(ctx.org.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'limit_exceeded',
          message: `Bot limit reached (${limitCheck.current}/${limitCheck.limit}). Upgrade your plan to create more bots.`,
          details: {
            current: limitCheck.current,
            limit: limitCheck.limit,
            planTier: limitCheck.planTier,
            upgradeRequired: true,
          },
        },
        { status: 402 } // Payment Required
      );
    }

    // Get or create default workspace
    let workspace;
    if (workspaceId) {
      workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          organizationId: ctx.org.id,
        },
      });
      if (!workspace) {
        return NextResponse.json(
          { ok: false, error: 'not_found', message: 'Workspace not found' },
          { status: 404 }
        );
      }
    } else {
      // Get or create default workspace
      workspace = await prisma.workspace.findFirst({
        where: { organizationId: ctx.org.id },
      });
      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: 'Default Workspace',
            organizationId: ctx.org.id,
          },
        });
      }
    }

    // Create bot
    const bot = await prisma.bot.create({
      data: {
        name,
        greeting,
        fallbackText,
        organizationId: ctx.org.id,
        workspaceId: workspace.id,
        status: 'ACTIVE',
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId: ctx.org.id,
        workspaceId: workspace.id,
        action: 'BOT_CREATED',
        summary: `Bot "${name}" created`,
        actorId: ctx.userId,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        bot: {
          id: bot.id,
          publicKey: bot.publicKey,
          name: bot.name,
          status: bot.status,
          greeting: bot.greeting,
          fallbackText: bot.fallbackText,
          workspace: bot.workspace,
          createdAt: bot.createdAt.toISOString(),
          updatedAt: bot.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[bots/POST] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to create bot' },
      { status: 500 }
    );
  }
}
