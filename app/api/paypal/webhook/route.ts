/**
 * PayPal Webhook Handler
 *
 * SETUP INSTRUCTIONS:
 * 1. In PayPal Dashboard, create a webhook pointing to: https://yourdomain.com/api/paypal/webhook
 * 2. Subscribe to these events:
 *    - BILLING.SUBSCRIPTION.ACTIVATED
 *    - BILLING.SUBSCRIPTION.CANCELLED
 *    - BILLING.SUBSCRIPTION.SUSPENDED
 *    - BILLING.SUBSCRIPTION.EXPIRED
 *    - BILLING.SUBSCRIPTION.UPDATED
 * 3. Copy the Webhook ID from PayPal dashboard and add to PAYPAL_WEBHOOK_ID in .env
 *
 * This endpoint receives PayPal webhook events and updates the database accordingly.
 * It uses service role access to bypass RLS policies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhookSignature } from '@/lib/paypal';
import { createClient } from '@supabase/supabase-js';

// Create a service role client for server-side operations that bypass RLS
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();

    // Extract headers needed for verification
    const headers = {
      'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
      'paypal-cert-url': request.headers.get('paypal-cert-url') || '',
      'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
    };

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify the webhook signature
    const isValid = await verifyPayPalWebhookSignature(webhookId, headers, rawBody);

    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse the webhook event
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;

    console.log('PayPal webhook event:', eventType, event.id);

    // Get the subscription resource from the event
    const resource = event.resource;
    const subscriptionId = resource?.id;
    const planId = resource?.plan_id;

    if (!subscriptionId) {
      console.error('No subscription ID in webhook event');
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    // Determine tier from plan ID
    const proPlanId = process.env.PAYPAL_PRO_PLAN_ID;
    const teamPlanId = process.env.PAYPAL_TEAM_PLAN_ID;
    const tier = planId === teamPlanId ? 'team' : 'pro';

    // Create service role client
    const supabase = createServiceRoleClient();

    // Find the subscription in our database by paypal_subscription_id
    const { data: existingSubscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .maybeSingle();

    if (findError) {
      console.error('Error finding subscription:', findError);
    }

    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        // Subscription was approved and activated
        const updates: any = {
          status: 'active',
          tier,
          paypal_subscription_id: subscriptionId,
          subscription_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Extract transaction ID if available
        if (resource.billing_info?.last_payment) {
          updates.paypal_transaction_id = resource.billing_info.last_payment.transaction_id;
        }

        if (existingSubscription) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update(updates)
            .eq('id', existingSubscription.id);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
          } else {
            // Log the change
            await supabase.from('subscription_changes').insert({
              user_id: existingSubscription.user_id,
              from_tier: existingSubscription.tier,
              to_tier: tier,
              reason: 'subscription_activated',
              paypal_transaction_id: updates.paypal_transaction_id,
            });
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        if (existingSubscription) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);

          if (updateError) {
            console.error('Error canceling subscription:', updateError);
          } else {
            // Log the change
            await supabase.from('subscription_changes').insert({
              user_id: existingSubscription.user_id,
              from_tier: existingSubscription.tier,
              to_tier: existingSubscription.tier,
              reason: 'subscription_canceled',
            });
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        if (existingSubscription) {
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);

          if (updateError) {
            console.error('Error expiring subscription:', updateError);
          } else {
            // Log the change
            await supabase.from('subscription_changes').insert({
              user_id: existingSubscription.user_id,
              from_tier: existingSubscription.tier,
              to_tier: existingSubscription.tier,
              reason: eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
                ? 'subscription_suspended'
                : 'subscription_expired',
            });
          }
        }
        break;
      }

      case 'BILLING.SUBSCRIPTION.UPDATED': {
        // Handle plan changes or other updates
        if (existingSubscription && planId) {
          const newTier = planId === teamPlanId ? 'team' : 'pro';

          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              tier: newTier,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);

          if (updateError) {
            console.error('Error updating subscription tier:', updateError);
          } else if (newTier !== existingSubscription.tier) {
            // Log the tier change
            await supabase.from('subscription_changes').insert({
              user_id: existingSubscription.user_id,
              from_tier: existingSubscription.tier,
              to_tier: newTier,
              reason: 'subscription_upgraded',
            });
          }
        }
        break;
      }

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
