import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import { prisma } from '@/lib/prisma';
import { getUpgradeRecommendation } from '@/lib/plans/enforcement';

export const dynamic = 'force-dynamic';

/**
 * GET /api/org/dashboard/stats
 * Get dashboard statistics for the organization
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
    // Get counts in parallel
    const [
      botCount,
      conversationCount,
      leadCount,
      hotLeadCount,
      org,
    ] = await Promise.all([
      prisma.bot.count({
        where: {
          organizationId: ctx.org.id,
          status: { not: 'ARCHIVED' },
        },
      }),
      prisma.conversation.count({
        where: { organizationId: ctx.org.id },
      }),
      prisma.lead.count({
        where: { organizationId: ctx.org.id },
      }),
      prisma.lead.count({
        where: {
          organizationId: ctx.org.id,
          temperature: 'HOT',
        },
      }),
      prisma.organization.findUnique({
        where: { id: ctx.org.id },
        select: {
          planTier: true,
          conversationsThisMonth: true,
          conversationsLimit: true,
          botsLimit: true,
        },
      }),
    ]);

    if (!org) {
      return NextResponse.json(
        { ok: false, error: 'not_found', message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get upgrade recommendation
    const upgradeRec = await getUpgradeRecommendation(ctx.org.id);

    // Calculate usage percentages
    const conversationUsagePercent = Math.round(
      (org.conversationsThisMonth / org.conversationsLimit) * 100
    );
    const botUsagePercent = Math.round((botCount / org.botsLimit) * 100);

    return NextResponse.json({
      ok: true,
      stats: {
        bots: {
          total: botCount,
          limit: org.botsLimit,
          usagePercent: botUsagePercent,
        },
        conversations: {
          total: conversationCount,
          thisMonth: org.conversationsThisMonth,
          limit: org.conversationsLimit,
          usagePercent: conversationUsagePercent,
        },
        leads: {
          total: leadCount,
          hot: hotLeadCount,
        },
        plan: {
          tier: org.planTier,
          shouldUpgrade: upgradeRec.shouldUpgrade,
          recommendedTier: upgradeRec.recommendedTier,
          upgradeReason: upgradeRec.reason,
        },
      },
    });
  } catch (error) {
    console.error('[dashboard/stats] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
