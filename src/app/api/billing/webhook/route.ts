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
    // IDEMPOTENCY CHECK: Prevent duplicate webhook processing
    // Note: We check audit logs for duplicate event IDs in summaries
    const existingWebhook = await prisma.auditLog.findFirst({
      where: {
        summary: {
          contains: `webhook_event:${event.id}`,
        },
      },
    });

    if (existingWebhook) {
      console.log(`[billing/webhook] Duplicate event ${event.id}, skipping`, {
        eventId: event.id,
        eventType: event.type,
        processedAt: existingWebhook.createdAt,
      });
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    console.log(`[billing/webhook] Processing event`, {
      eventId: event.id,
      eventType: event.type,
    });

    // PROCESS EVENT
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, event.id);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, event.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, event.id);
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
        console.log(`[billing/webhook] Unhandled event type: ${event.type}`, {
          eventId: event.id,
          eventType: event.type,
        });
    }

    console.log(`[billing/webhook] Event processed successfully`, {
      eventId: event.id,
      eventType: event.type,
    });

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error('[billing/webhook] Error processing event:', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { ok: false, error: 'processing_error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, webhookEventId: string) {
  const organizationId = session.metadata?.organizationId;
  const planTier = session.metadata?.planTier as PlanTier;

  if (!organizationId || !planTier) {
    console.error('[billing/webhook] Missing metadata in checkout session', {
      sessionId: session.id,
      hasOrgId: !!organizationId,
      hasPlanTier: !!planTier,
    });
    return;
  }

  const planFeatures = PLAN_FEATURES[planTier];
  const orgId = parseInt(organizationId);

  console.log('[billing/webhook] Upgrading organization', {
    organizationId: orgId,
    planTier,
    sessionId: session.id,
  });

  // Update organization with new plan
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      planTier: planTier,
      planStartedAt: new Date(),
      planExpiresAt: null, // Will be set based on subscription
      conversationsLimit: planFeatures.conversationsPerMonth,
      botsLimit: planFeatures.botsLimit,
      conversationsThisMonth: 0, // Reset counter on upgrade
    },
  });

  // Create audit log for idempotency tracking
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      action: 'BOT_UPDATED', // Reusing existing action
      summary: `Plan upgraded to ${planTier} via webhook_event:${webhookEventId} session:${session.id}`,
      actorId: null,
    },
  });

  console.log('[billing/webhook] Organization upgraded successfully', {
    organizationId: orgId,
    planTier,
    sessionId: session.id,
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, webhookEventId: string) {
  // Handle subscription renewal, plan changes, etc.
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('[billing/webhook] Missing organizationId in subscription metadata', {
      subscriptionId: subscription.id,
    });
    return;
  }

  const orgId = parseInt(organizationId);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Update plan expiration date
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      planExpiresAt: currentPeriodEnd,
    },
  });

  // Create audit log for idempotency tracking
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      action: 'BOT_UPDATED', // Reusing existing action
      summary: `Subscription updated via webhook_event:${webhookEventId} subscription:${subscription.id}`,
      actorId: null,
    },
  });

  console.log('[billing/webhook] Subscription updated', {
    organizationId,
    subscriptionId: subscription.id,
    newExpiryDate: currentPeriodEnd.toISOString(),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, webhookEventId: string) {
  // Downgrade to FREE when subscription is canceled
  const organizationId = subscription.metadata?.organizationId;

  if (!organizationId) {
    console.error('[billing/webhook] Missing organizationId in subscription metadata', {
      subscriptionId: subscription.id,
    });
    return;
  }

  const orgId = parseInt(organizationId);
  const freeFeatures = PLAN_FEATURES[PlanTier.FREE];

  console.log('[billing/webhook] Downgrading organization to FREE', {
    organizationId,
    subscriptionId: subscription.id,
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      planTier: PlanTier.FREE,
      planExpiresAt: null,
      conversationsLimit: freeFeatures.conversationsPerMonth,
      botsLimit: freeFeatures.botsLimit,
      conversationsThisMonth: 0, // Reset counter
    },
  });

  // Create audit log for idempotency tracking
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      action: 'BOT_UPDATED', // Reusing existing action
      summary: `Subscription canceled, downgraded to FREE via webhook_event:${webhookEventId} subscription:${subscription.id}`,
      actorId: null,
    },
  });

  console.log('[billing/webhook] Organization downgraded to FREE', {
    organizationId,
    subscriptionId: subscription.id,
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('[billing/webhook] Payment succeeded', {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
    customerId: invoice.customer,
  });
  // Could send a receipt email here
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.error('[billing/webhook] Payment failed', {
    invoiceId: invoice.id,
    amount: invoice.amount_due,
    customerId: invoice.customer,
    attemptCount: invoice.attempt_count,
  });
  // Could send a payment failure email here
}
