import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { stripe, isStripeConfigured } from "@/lib/stripe/client";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured", message: "Billing is not configured" },
      { status: 503 }
    );
  }

  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: ctx.org.id },
  });

  if (!subscription) {
    return NextResponse.json(
      { ok: false, error: "no_subscription", message: "No active subscription found" },
      { status: 404 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/app/settings/billing`,
  });

  return NextResponse.json({
    ok: true,
    url: portalSession.url,
  });
}
