import { prisma } from "@/lib/prisma";

export interface FeatureLimits {
  maxBots: number;
  maxLeadsPerMonth: number;
  maxConversationsPerMonth: number;
  customBranding: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface UsageStats {
  bots: number;
  leads: number;
  conversations: number;
}

// Free tier limits - generous for demos
const FREE_TIER_LIMITS: FeatureLimits = {
  maxBots: 1,
  maxLeadsPerMonth: 25,
  maxConversationsPerMonth: 100,
  customBranding: false,
  customDomain: false,
  apiAccess: false,
  prioritySupport: false,
};

export async function getOrgLimits(organizationId: number): Promise<FeatureLimits> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      plan: {
        select: {
          maxBots: true,
          maxLeadsPerMonth: true,
          maxConversationsPerMonth: true,
          customBranding: true,
          customDomain: true,
          apiAccess: true,
          prioritySupport: true,
        },
      },
    },
  });

  // No subscription or cancelled = free tier
  if (!subscription || subscription.status === "CANCELLED") {
    return FREE_TIER_LIMITS;
  }

  // Past due gets limited access
  if (subscription.status === "PAST_DUE") {
    return FREE_TIER_LIMITS;
  }

  return {
    maxBots: subscription.plan.maxBots,
    maxLeadsPerMonth: subscription.plan.maxLeadsPerMonth,
    maxConversationsPerMonth: subscription.plan.maxConversationsPerMonth,
    customBranding: subscription.plan.customBranding,
    customDomain: subscription.plan.customDomain,
    apiAccess: subscription.plan.apiAccess,
    prioritySupport: subscription.plan.prioritySupport,
  };
}

export async function getOrgUsage(
  organizationId: number,
  periodStart?: Date
): Promise<UsageStats> {
  const startDate = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [botCount, leadCount, conversationCount] = await Promise.all([
    prisma.bot.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    prisma.lead.count({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    }),
    prisma.conversation.count({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    }),
  ]);

  return {
    bots: botCount,
    leads: leadCount,
    conversations: conversationCount,
  };
}

export type FeatureCheckResult =
  | { allowed: true }
  | { allowed: false; reason: string; limitType: string };

export async function canCreateBot(organizationId: number): Promise<FeatureCheckResult> {
  const [limits, usage] = await Promise.all([
    getOrgLimits(organizationId),
    getOrgUsage(organizationId),
  ]);

  if (usage.bots >= limits.maxBots) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limits.maxBots} bot(s). Upgrade your plan for more.`,
      limitType: "bots",
    };
  }

  return { allowed: true };
}

export async function canCreateLead(organizationId: number): Promise<FeatureCheckResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { currentPeriodStart: true },
  });

  const [limits, usage] = await Promise.all([
    getOrgLimits(organizationId),
    getOrgUsage(organizationId, subscription?.currentPeriodStart),
  ]);

  if (usage.leads >= limits.maxLeadsPerMonth) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limits.maxLeadsPerMonth} leads this month. Upgrade your plan for more.`,
      limitType: "leads",
    };
  }

  return { allowed: true };
}

export async function canCreateConversation(organizationId: number): Promise<FeatureCheckResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    select: { currentPeriodStart: true },
  });

  const [limits, usage] = await Promise.all([
    getOrgLimits(organizationId),
    getOrgUsage(organizationId, subscription?.currentPeriodStart),
  ]);

  if (usage.conversations >= limits.maxConversationsPerMonth) {
    return {
      allowed: false,
      reason: `You have reached your limit of ${limits.maxConversationsPerMonth} conversations this month. Upgrade your plan for more.`,
      limitType: "conversations",
    };
  }

  return { allowed: true };
}

export async function canUseCustomBranding(organizationId: number): Promise<boolean> {
  const limits = await getOrgLimits(organizationId);
  return limits.customBranding;
}

export async function canUseCustomDomain(organizationId: number): Promise<boolean> {
  const limits = await getOrgLimits(organizationId);
  return limits.customDomain;
}

export async function canUseApi(organizationId: number): Promise<boolean> {
  const limits = await getOrgLimits(organizationId);
  return limits.apiAccess;
}

export async function incrementLeadUsage(organizationId: number): Promise<void> {
  await prisma.subscription.updateMany({
    where: { organizationId },
    data: {
      leadsUsedThisPeriod: { increment: 1 },
    },
  });
}

export async function incrementConversationUsage(organizationId: number): Promise<void> {
  await prisma.subscription.updateMany({
    where: { organizationId },
    data: {
      conversationsUsedThisPeriod: { increment: 1 },
    },
  });
}
