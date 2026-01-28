import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
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
  });

  // Add free tier as first option
  const allPlans = [
    {
      publicId: "free",
      name: "Free Trial",
      description: "Try it out - no credit card required",
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
    ...plans,
  ];

  return NextResponse.json({
    ok: true,
    plans: allPlans,
  });
}
