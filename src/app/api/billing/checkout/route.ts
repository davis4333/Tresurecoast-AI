import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import { z } from 'zod';
import Stripe from 'stripe';
import { PlanTier, PLAN_FEATURES } from '@/lib/plans/features';

// Initialize Stripe only if API key is available (for build-time compatibility)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

const checkoutSchema = z.object({
  planTier: z.enum(['STARTER', 'PRO', 'AGENCY', 'ENTERPRISE']),
});

/**
 * POST /api/billing/checkout
 * Create a Stripe checkout session for plan upgrade
 */
export async function POST(request: NextRequest) {
  const ctx = await getOrgContext({ request });
  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'stripe_not_configured', message: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: 'invalid_body', message: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'validation_error',
          message: 'Invalid data',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { planTier } = validation.data;

    const planFeatures = PLAN_FEATURES[planTier as PlanTier];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Treasure Coast AI - ${planFeatures.name} Plan`,
              description: `${planFeatures.conversationsPerMonth.toLocaleString()} conversations/month, ${planFeatures.botsLimit} bots`,
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: planFeatures.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        organizationId: ctx.org.id.toString(),
        planTier: planTier,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing?canceled=true`,
      customer_email: ctx.org.name ? undefined : ctx.userId, // Use org name if available, otherwise user ID
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('[billing/checkout] Error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error', message: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
