import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, tier, paypal_subscription_id, paypal_transaction_id } = body;

    // Build update object with only provided fields
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    }
    if (tier) {
      updates.tier = tier;
    }
    if (paypal_subscription_id !== undefined) {
      updates.paypal_subscription_id = paypal_subscription_id;
    }
    if (paypal_transaction_id !== undefined) {
      updates.paypal_transaction_id = paypal_transaction_id;
    }

    // Update the user's subscription
    const { data: subscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error('Error in subscription update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
