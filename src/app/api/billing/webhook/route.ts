import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { PlanTier, PLAN_FEATURES } from '@/lib/plans/features';

// Initialize Stripe only if API key is available (for build-time compatibility)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/billing/webhook
 * Handle Stripe webhook events for subscription changes
 */
export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { ok: false, error: 'stripe_not_configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: 'missing_signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('[billing/webhook] Signature verification failed:', error);
    return NextResponse.json(
      { ok: false, error: 'invalid_signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[billing/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error('[billing/webhook] Error processing event:', error);
    return NextResponse.json(
      { ok: false, error: 'processing_error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const planTier = session.metadata?.planTier as PlanTier;

  if (!organizationId || !planTier) {
    console.error('[billing/webhook] Missing metadata in checkout session');
    return;
  }

  const planFeatures = PLAN_FEATURES[planTier];

  // Update organization with new plan
  await prisma.organization.update({
    where: { id: parseInt(organizationId) },
    data: {
      planTier: planTier,
      planStartedAt: new Date(),
      planExpiresAt: null, // Will be set based on subscription
      conversationsLimit: planFeatures.conversationsPerMonth,
      botsLimit: planFeatures.botsLimit,
      conversationsThisMonth: 0, // Reset counter on upgrade
    },
  });

  console.log(
    `[billing/webhook] Organization ${organizationId} upgraded to ${planTier}`
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle subscription renewal, plan changes, etc.
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('[billing/webhook] Missing organizationId in subscription metadata');
    return;
  }

  // Update plan expiration date
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  await prisma.organization.update({
    where: { id: parseInt(organizationId) },
    data: {
      planExpiresAt: currentPeriodEnd,
    },
  });

  console.log(
    `[billing/webhook] Subscription updated for organization ${organizationId}`
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Downgrade to FREE when subscription is canceled
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('[billing/webhook] Missing organizationId in subscription metadata');
    return;
  }

  const freeFeatures = PLAN_FEATURES[PlanTier.FREE];

  await prisma.organization.update({
    where: { id: parseInt(organizationId) },
    data: {
      planTier: PlanTier.FREE,
      planExpiresAt: null,
      conversationsLimit: freeFeatures.conversationsPerMonth,
      botsLimit: freeFeatures.botsLimit,
      conversationsThisMonth: 0, // Reset counter
    },
  });

  console.log(
    `[billing/webhook] Organization ${organizationId} downgraded to FREE (subscription canceled)`
  );
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`[billing/webhook] Payment succeeded for invoice ${invoice.id}`);
  // Could send a receipt email here
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.error(`[billing/webhook] Payment failed for invoice ${invoice.id}`);
  // Could send a payment failure email here
}
