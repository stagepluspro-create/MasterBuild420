import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Auto-create subscription for authenticated users
 * This ensures every user has exactly one subscription row
 */
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

    // Check if user already has a subscription
    const { data: existingSubscription, error: findError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError) {
      console.error('Error checking for existing subscription:', findError);
      return NextResponse.json(
        { error: findError.message },
        { status: 500 }
      );
    }

    // If subscription exists, return it
    if (existingSubscription) {
      return NextResponse.json({ subscription: existingSubscription });
    }

    // Create a new trial subscription
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const { data: newSubscription, error: createError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: 'pro',
        status: 'trial',
        seats: 1,
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating subscription:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscription: newSubscription });
  } catch (error: any) {
    console.error('Error in ensure-subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
