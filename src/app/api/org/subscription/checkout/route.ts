import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { stripe, isStripeConfigured } from "@/lib/stripe/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
});

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parseResult = checkoutSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parseResult.error.message },
      { status: 400 }
    );
  }

  const { planId } = parseResult.data;

  // Get plan
  const plan = await prisma.plan.findFirst({
    where: { publicId: planId, isActive: true },
  });

  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "plan_not_found", message: "Plan not found" },
      { status: 404 }
    );
  }

  // Check if org already has subscription
  const existingSubscription = await prisma.subscription.findUnique({
    where: { organizationId: ctx.org.id },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (existingSubscription) {
    // Create billing portal session to manage existing subscription
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: existingSubscription.stripeCustomerId,
      return_url: `${appUrl}/app/settings/billing`,
    });

    return NextResponse.json({
      ok: true,
      type: "portal",
      url: portalSession.url,
    });
  }

  // Get org details for prefilling
  const org = await prisma.organization.findUnique({
    where: { id: ctx.org.id },
    include: {
      businessProfile: {
        select: { businessName: true, email: true },
      },
    },
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/app/settings/billing?success=true`,
    cancel_url: `${appUrl}/app/settings/billing?cancelled=true`,
    metadata: {
      organizationId: ctx.org.id.toString(),
      planId: plan.id.toString(),
    },
    customer_email: org?.businessProfile?.email ?? undefined,
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
      metadata: {
        organizationId: ctx.org.id.toString(),
        planId: plan.id.toString(),
      },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({
    ok: true,
    type: "checkout",
    url: session.url,
    sessionId: session.id,
  });
}
