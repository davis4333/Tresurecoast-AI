import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "missing_signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Signature verification failed:", err);
    return NextResponse.json(
      { ok: false, error: "invalid_signature" },
      { status: 400 }
    );
  }

  console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (err) {
    console.error("[STRIPE WEBHOOK] Error processing event:", err);
    return NextResponse.json(
      { ok: false, error: "processing_error" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.organizationId;
  const planId = session.metadata?.planId;

  if (!orgId || !planId) {
    console.error("[STRIPE WEBHOOK] Missing metadata in checkout session");
    return;
  }

  const organizationId = parseInt(orgId, 10);
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Get subscription details from Stripe
  const subscription = await stripe!.subscriptions.retrieve(subscriptionId) as unknown as {
    status: string;
    current_period_start: number;
    current_period_end: number;
    trial_start: number | null;
    trial_end: number | null;
  };

  // Create or update subscription in database
  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId: parseInt(planId, 10),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
    update: {
      planId: parseInt(planId, 10),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });

  // Log audit event
  await prisma.auditLog.create({
    data: {
      organizationId,
      action: "SUBSCRIPTION_CREATED",
      summary: `Subscription created via Stripe checkout`,
    },
  });

  console.log(`[STRIPE WEBHOOK] Created subscription for org ${organizationId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = subscription as unknown as {
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
    items: { data: Array<{ price: { id: string } }> };
  };

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!existingSub) {
    console.log(`[STRIPE WEBHOOK] Subscription not found: ${sub.id}`);
    return;
  }

  // Get the price ID to find the plan
  const priceId = sub.items.data[0]?.price.id;
  let planId = existingSub.planId;

  if (priceId) {
    const plan = await prisma.plan.findFirst({
      where: { stripePriceId: priceId },
    });
    if (plan) {
      planId = plan.id;
    }
  }

  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: {
      planId,
      status: mapStripeStatus(sub.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      cancelledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  // Log audit event
  await prisma.auditLog.create({
    data: {
      organizationId: existingSub.organizationId,
      action: "SUBSCRIPTION_UPDATED",
      summary: `Subscription updated: ${sub.status}`,
    },
  });

  console.log(`[STRIPE WEBHOOK] Updated subscription ${sub.id}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const sub = subscription as unknown as { id: string };

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });

  if (!existingSub) {
    console.log(`[STRIPE WEBHOOK] Subscription not found: ${sub.id}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  // Log audit event
  await prisma.auditLog.create({
    data: {
      organizationId: existingSub.organizationId,
      action: "SUBSCRIPTION_CANCELLED",
      summary: `Subscription cancelled`,
    },
  });

  console.log(`[STRIPE WEBHOOK] Cancelled subscription ${sub.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const inv = invoice as unknown as { subscription: string | null };
  const subscriptionId = inv.subscription;

  if (!subscriptionId) return;

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existingSub) return;

  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: {
      status: "PAST_DUE",
    },
  });

  console.log(`[STRIPE WEBHOOK] Payment failed for subscription ${subscriptionId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const inv = invoice as unknown as { subscription: string | null };
  const subscriptionId = inv.subscription;

  if (!subscriptionId) return;

  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!existingSub) return;

  // Reset usage counters for new billing period
  await prisma.subscription.update({
    where: { id: existingSub.id },
    data: {
      status: "ACTIVE",
      leadsUsedThisPeriod: 0,
      conversationsUsedThisPeriod: 0,
    },
  });

  console.log(`[STRIPE WEBHOOK] Invoice paid for subscription ${subscriptionId}`);
}

function mapStripeStatus(status: string): "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" | "PAUSED" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELLED";
    case "trialing":
      return "TRIALING";
    case "paused":
      return "PAUSED";
    default:
      return "ACTIVE";
  }
}
