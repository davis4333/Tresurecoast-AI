import { NextRequest, NextResponse } from 'next/server';
import { getOrgContext } from '@/lib/auth/getOrgContext';
import Stripe from 'stripe';

// Initialize Stripe only if API key is available (for build-time compatibility)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

/**
 * POST /api/stripe/portal
 * Create a Stripe Customer Portal session for managing billing
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
    // Find the customer's subscription by searching for organizationId in metadata
    const subscriptions = await stripe.subscriptions.search({
      query: `metadata['organizationId']:'${ctx.org.id}'`,
      limit: 1,
    });

    const subscription = subscriptions.data[0];

    if (!subscription || !subscription.customer) {
      return NextResponse.json(
        {
          ok: false,
          error: 'no_subscription',
          message: 'No active subscription found. Please upgrade to a paid plan first.'
        },
        { status: 404 }
      );
    }

    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings/billing`,
    });

    return NextResponse.json({
      ok: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.error('[stripe/portal] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'internal_error',
        message: 'Failed to create billing portal session'
      },
      { status: 500 }
    );
  }
}
