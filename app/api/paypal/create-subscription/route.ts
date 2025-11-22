import { NextRequest, NextResponse } from 'next/server';
import { createPayPalSubscription } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier } = body;

    if (!tier || (tier !== 'pro' && tier !== 'team')) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "pro" or "team"' },
        { status: 400 }
      );
    }

    // Map tier to PayPal plan ID
    const planId = tier === 'team'
      ? process.env.PAYPAL_TEAM_PLAN_ID!
      : process.env.PAYPAL_PRO_PLAN_ID!;

    if (!planId) {
      console.error(`PayPal plan ID not configured for tier: ${tier}`);
      return NextResponse.json(
        { error: 'Subscription plan not configured' },
        { status: 500 }
      );
    }

    // Create subscription with PayPal
    const subscription = await createPayPalSubscription(planId);

    return NextResponse.json({
      subscriptionId: subscription.id,
      approveLink: subscription.approveLink,
    });
  } catch (error: any) {
    console.error('Error creating PayPal subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
