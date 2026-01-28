import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: ctx.org.id },
    include: {
      plan: {
        select: {
          publicId: true,
          name: true,
          description: true,
          priceCents: true,
          interval: true,
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

  // Get usage stats
  const [botCount, leadsThisMonth, conversationsThisMonth] = await Promise.all([
    prisma.bot.count({ where: { organizationId: ctx.org.id, status: "ACTIVE" } }),
    prisma.lead.count({
      where: {
        organizationId: ctx.org.id,
        createdAt: { gte: subscription?.currentPeriodStart ?? new Date() },
      },
    }),
    prisma.conversation.count({
      where: {
        organizationId: ctx.org.id,
        createdAt: { gte: subscription?.currentPeriodStart ?? new Date() },
      },
    }),
  ]);

  if (!subscription) {
    // Return free tier info
    return NextResponse.json({
      ok: true,
      subscription: null,
      plan: {
        name: "Free Trial",
        description: "Limited free access for demos",
        priceCents: 0,
        interval: "month",
        maxBots: 1,
        maxLeadsPerMonth: 25,
        maxConversationsPerMonth: 100,
        customBranding: false,
        customDomain: false,
        apiAccess: false,
        prioritySupport: false,
      },
      usage: {
        bots: botCount,
        maxBots: 1,
        leads: leadsThisMonth,
        maxLeads: 25,
        conversations: conversationsThisMonth,
        maxConversations: 100,
      },
      isFreeTier: true,
    });
  }

  return NextResponse.json({
    ok: true,
    subscription: {
      publicId: subscription.publicId,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
      trialEnd: subscription.trialEnd?.toISOString() ?? null,
    },
    plan: subscription.plan,
    usage: {
      bots: botCount,
      maxBots: subscription.plan.maxBots,
      leads: leadsThisMonth,
      maxLeads: subscription.plan.maxLeadsPerMonth,
      conversations: conversationsThisMonth,
      maxConversations: subscription.plan.maxConversationsPerMonth,
    },
    isFreeTier: false,
  });
}
