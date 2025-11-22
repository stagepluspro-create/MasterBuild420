/**
 * PayPal Subscriptions API Integration
 *
 * This module provides server-side helpers for PayPal Subscriptions API.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Configure PayPal Dashboard:
 *    - Go to https://developer.paypal.com/ (sandbox) or https://www.paypal.com/businessmanage/account/subscriptions (live)
 *    - Create two subscription plans (Pro and Team)
 *    - Copy the Plan IDs and add them to your .env file
 *
 * 2. Create a webhook:
 *    - Go to Webhooks section in PayPal dashboard
 *    - Add webhook URL: https://yourdomain.com/api/paypal/webhook
 *    - Subscribe to these events:
 *      * BILLING.SUBSCRIPTION.ACTIVATED
 *      * BILLING.SUBSCRIPTION.CANCELLED
 *      * BILLING.SUBSCRIPTION.SUSPENDED
 *      * BILLING.SUBSCRIPTION.EXPIRED
 *      * BILLING.SUBSCRIPTION.UPDATED
 *    - Copy the Webhook ID and add it to your .env file
 *
 * 3. Environment Variables Required:
 *    PAYPAL_CLIENT_ID=your_client_id
 *    PAYPAL_CLIENT_SECRET=your_client_secret
 *    PAYPAL_ENV=sandbox or live
 *    PAYPAL_PRO_PLAN_ID=plan_id_for_pro
 *    PAYPAL_TEAM_PLAN_ID=plan_id_for_team
 *    PAYPAL_WEBHOOK_ID=webhook_id
 *    NEXT_PUBLIC_SITE_URL=https://www.stagetechpro.online
 */

const PAYPAL_API_BASE = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
};

function getPayPalBaseURL(): string {
  const env = process.env.PAYPAL_ENV || 'sandbox';
  return PAYPAL_API_BASE[env as 'sandbox' | 'live'] || PAYPAL_API_BASE.sandbox;
}

/**
 * Get an OAuth 2.0 access token from PayPal
 * Tokens are valid for ~9 hours but we don't cache them here
 */
export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const base = getPayPalBaseURL();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get PayPal access token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal subscription for the given plan
 *
 * @param planId - The PayPal plan ID (either Pro or Team)
 * @returns Object with subscription id, status, and approveLink
 */
export async function createPayPalSubscription(planId: string): Promise<{
  id: string;
  status: string;
  approveLink: string;
}> {
  const accessToken = await getPayPalAccessToken();
  const base = getPayPalBaseURL();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const response = await fetch(`${base}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: 'Stage Tech Pro',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${siteUrl}/paypal?status=success`,
        cancel_url: `${siteUrl}/paypal?status=cancel`,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create PayPal subscription: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  // Find the approve link from the links array
  const approveLink = data.links?.find((link: any) => link.rel === 'approve')?.href;

  if (!approveLink) {
    throw new Error('No approve link returned from PayPal');
  }

  return {
    id: data.id,
    status: data.status,
    approveLink,
  };
}

/**
 * Verify a PayPal webhook signature
 *
 * @param webhookId - Your webhook ID from PayPal dashboard
 * @param headers - The request headers from the webhook POST
 * @param body - The raw request body (as string or buffer)
 * @returns true if signature is valid, false otherwise
 */
export async function verifyPayPalWebhookSignature(
  webhookId: string,
  headers: {
    'paypal-auth-algo'?: string;
    'paypal-cert-url'?: string;
    'paypal-transmission-id'?: string;
    'paypal-transmission-sig'?: string;
    'paypal-transmission-time'?: string;
  },
  body: string
): Promise<boolean> {
  const accessToken = await getPayPalAccessToken();
  const base = getPayPalBaseURL();

  const verificationData = {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(body),
  };

  const response = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verificationData),
  });

  if (!response.ok) {
    console.error('PayPal webhook verification failed:', await response.text());
    return false;
  }

  const result = await response.json();
  return result.verification_status === 'SUCCESS';
}

/**
 * Get subscription details from PayPal
 * Useful for checking current status
 */
export async function getPayPalSubscription(subscriptionId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const base = getPayPalBaseURL();

  const response = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get PayPal subscription: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Cancel a PayPal subscription
 * Use this when user cancels from your UI
 */
export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const accessToken = await getPayPalAccessToken();
  const base = getPayPalBaseURL();

  const response = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: reason || 'Customer requested cancellation',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel PayPal subscription: ${response.status} ${errorText}`);
  }
}
