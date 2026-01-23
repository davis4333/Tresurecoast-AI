import { prisma } from '@/lib/prisma';
import { PlanTier, PLAN_FEATURES, getPlanFeatures } from '@/lib/plans/features';

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  planTier: PlanTier;
  needsUpgrade: boolean;
}

/**
 * Check if organization can create another bot
 */
export async function checkBotLimit(organizationId: number): Promise<LimitCheckResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planTier: true,
      botsLimit: true,
      _count: {
        select: {
          bots: {
            where: {
              status: { not: 'ARCHIVED' },
            },
          },
        },
      },
    },
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  const current = org._count.bots;
  const limit = org.botsLimit;
  const allowed = current < limit;
  const remaining = Math.max(0, limit - current);

  return {
    allowed,
    current,
    limit,
    remaining,
    planTier: org.planTier as PlanTier,
    needsUpgrade: !allowed,
  };
}

/**
 * Check if organization can create another conversation this month
 */
export async function checkConversationLimit(organizationId: number): Promise<LimitCheckResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planTier: true,
      conversationsThisMonth: true,
      conversationsLimit: true,
    },
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  const current = org.conversationsThisMonth;
  const limit = org.conversationsLimit;
  const allowed = current < limit;
  const remaining = Math.max(0, limit - current);

  return {
    allowed,
    current,
    limit,
    remaining,
    planTier: org.planTier as PlanTier,
    needsUpgrade: !allowed,
  };
}

/**
 * Increment conversation counter for the month
 */
export async function incrementConversationCount(organizationId: number): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      conversationsThisMonth: {
        increment: 1,
      },
    },
  });
}

/**
 * Reset monthly conversation counter (run via cron on 1st of each month)
 */
export async function resetMonthlyConversationCounters(): Promise<number> {
  const result = await prisma.organization.updateMany({
    data: {
      conversationsThisMonth: 0,
    },
  });

  return result.count;
}

/**
 * Check if organization has access to a premium feature
 */
export async function checkFeatureAccess(
  organizationId: number,
  feature: keyof typeof PLAN_FEATURES.FREE
): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { planTier: true },
  });

  if (!org) {
    return false;
  }

  const planFeatures = getPlanFeatures(org.planTier as PlanTier);
  const value = planFeatures[feature];

  // For boolean features, return the value directly
  if (typeof value === 'boolean') {
    return value;
  }

  // For numeric features, return true if > 0
  if (typeof value === 'number') {
    return value > 0;
  }

  return false;
}

/**
 * Get upgrade recommendation based on current usage
 */
export async function getUpgradeRecommendation(organizationId: number): Promise<{
  shouldUpgrade: boolean;
  recommendedTier: PlanTier | null;
  reason: string;
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      planTier: true,
      conversationsThisMonth: true,
      conversationsLimit: true,
      botsLimit: true,
      _count: {
        select: {
          bots: {
            where: { status: { not: 'ARCHIVED' } },
          },
        },
      },
    },
  });

  if (!org) {
    return { shouldUpgrade: false, recommendedTier: null, reason: '' };
  }

  const currentTier = org.planTier as PlanTier;
  const botCount = org._count.bots;
  const conversationUsage = org.conversationsThisMonth / org.conversationsLimit;

  // If at 80% of conversation limit, recommend upgrade
  if (conversationUsage >= 0.8) {
    const nextTier = getNextTier(currentTier);
    if (nextTier) {
      return {
        shouldUpgrade: true,
        recommendedTier: nextTier,
        reason: `You've used ${Math.round(conversationUsage * 100)}% of your monthly conversations. Upgrade to get ${getPlanFeatures(nextTier).conversationsPerMonth.toLocaleString()} conversations/month.`,
      };
    }
  }

  // If at bot limit, recommend upgrade
  if (botCount >= org.botsLimit) {
    const nextTier = getNextTier(currentTier);
    if (nextTier) {
      return {
        shouldUpgrade: true,
        recommendedTier: nextTier,
        reason: `You've reached your bot limit (${org.botsLimit}). Upgrade to create ${getPlanFeatures(nextTier).botsLimit} bots.`,
      };
    }
  }

  return { shouldUpgrade: false, recommendedTier: null, reason: '' };
}

/**
 * Get the next tier in the upgrade path
 */
function getNextTier(currentTier: PlanTier): PlanTier | null {
  const tiers: PlanTier[] = [
    PlanTier.FREE,
    PlanTier.STARTER,
    PlanTier.PRO,
    PlanTier.AGENCY,
    PlanTier.ENTERPRISE,
  ];

  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1]!;
  }

  return null; // Already at highest tier
}
