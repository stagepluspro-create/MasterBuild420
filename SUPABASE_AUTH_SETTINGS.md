# Supabase Authentication Settings

Complete configuration guide for Supabase Authentication in your StageTechPro production deployment.

## 🔐 Critical Configuration

Your application uses **Supabase Auth exclusively**. Configure these settings in your Supabase Dashboard.

### Production Domain

```
https://stagetechpro.online
```

## 📋 Step-by-Step Configuration

### 1. Access Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project: `qnwcbenxwzwdwcdiwrph`
3. Navigate to **Authentication → URL Configuration**

### 2. Configure Site URL

**Setting:** Site URL

**Value:**
```
https://stagetechpro.online
```

**Purpose:** This is the primary URL for your application. Supabase uses this for email templates and redirect validation.

### 3. Configure Redirect URLs

**Setting:** Redirect URLs

**Add these URLs (one per line):**

```
https://stagetechpro.online/*
https://stagetechpro.online/auth/*
https://stagetechpro.online/auth/callback
https://stagetechpro.online/auth/update-password
https://stagetechpro.online/profile
https://stagetechpro.online/profile/*
https://stagetechpro.online/dashboard
https://stagetechpro.online/api/auth/callback/*
https://*.vercel.app/*
https://*.vercel.app/auth/callback
```

**Purpose:** These URLs are allowed as redirect targets after authentication. Wildcards (`*`) allow subdirectories.

**Why Vercel URLs?**
- Needed for preview deployments
- Allows testing on `https://your-project-git-branch.vercel.app`
- Production redirects still go to `stagetechpro.online`

### 4. Email Template Configuration

Navigate to **Authentication → Email Templates**

#### Confirm Signup Template

**Subject:** `Confirm your email for StageTechPro`

**Redirect URL in template:**
```
{{ .ConfirmationURL }}
```

This automatically uses `https://stagetechpro.online/auth/callback` based on your Site URL.

**Important:** DO NOT hardcode URLs in email templates. Use the template variables.

#### Reset Password Template

**Subject:** `Reset your password for StageTechPro`

**Redirect URL in template:**
```
{{ .ConfirmationURL }}
```

This will direct users to `https://stagetechpro.online/auth/update-password`.

#### Magic Link Template (if used)

**Subject:** `Your magic link for StageTechPro`

**Redirect URL:**
```
{{ .ConfirmationURL }}
```

### 5. Auth Providers Configuration

Navigate to **Authentication → Providers**

#### Email Provider (Enabled by default)

**Settings:**
- ✅ Enable email provider: **ON**
- ✅ Confirm email: **OFF** (for instant signup)
- ✅ Secure email change: **ON**

**Note:** Your app uses email/password auth. Users can sign up and log in immediately without email confirmation (unless you enable it).

#### OAuth Providers (Optional)

Currently not configured. If you want to add:
- Google OAuth
- GitHub OAuth
- Other providers

Add them here and update your signup/signin pages to include OAuth buttons.

### 6. Security Settings

Navigate to **Authentication → Policies**

#### Rate Limiting

**Recommended settings:**
- Max concurrent sessions: `5` per user
- Password reset requests: `3` per hour
- Failed login attempts: `5` per hour

#### Session Settings

- **JWT expiry:** `3600` seconds (1 hour)
- **Refresh token expiry:** `2592000` seconds (30 days)
- **Refresh token reuse interval:** `10` seconds

### 7. Environment Variables

Ensure these are set in **Vercel → Settings → Environment Variables**:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://qnwcbenxwzwdwcdiwrph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>

# Site URL (REQUIRED)
NEXT_PUBLIC_SITE_URL=https://stagetechpro.online
```

**Important:**
- Set these for **Production**, **Preview**, and **Development** environments
- For local development, use `http://localhost:3000` as `NEXT_PUBLIC_SITE_URL`

## 🔄 Authentication Flows

### Signup Flow

1. User visits `/auth/signup`
2. Enters email and password
3. Supabase creates user account
4. If email confirmation enabled:
   - User receives confirmation email
   - Clicks link → redirects to `/auth/callback`
   - Callback exchanges code for session
   - Redirects to `/dashboard`
5. If email confirmation disabled:
   - Immediately redirected to `/dashboard`

### Login Flow

1. User visits `/auth/signin`
2. Enters email and password
3. Supabase validates credentials
4. Session created
5. Redirects to `/dashboard`

### Password Reset Flow

1. User visits `/auth/reset-password`
2. Enters email
3. Receives reset email from Supabase
4. Clicks link → redirects to `/auth/update-password`
5. User sets new password
6. Redirects to `/dashboard`

### Callback Flow

**URL:** `/auth/callback`

**Purpose:** Handles OAuth redirects and email confirmation links

**Process:**
1. Receives `code` parameter from Supabase
2. Exchanges code for session using `supabase.auth.exchangeCodeForSession()`
3. Sets session cookies
4. Redirects to `/dashboard` (or `next` parameter if provided)

## 🛡️ Middleware Protection

**File:** `middleware.ts`

**Protected routes:**
- `/profile` and all subpages
- `/teams` and all subpages
- `/dashboard`
- `/tools` and all tools

**Behavior:**
- Unauthenticated users → redirect to `/auth/signin`
- Authenticated users on auth pages → redirect to `/dashboard`
- Auth callback always allowed

## 🧪 Testing Checklist

### Local Development

```bash
# Set .env.local
NEXT_PUBLIC_SUPABASE_URL=https://qnwcbenxwzwdwcdiwrph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
SUPABASE_JWT_SECRET=<your-secret>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Add localhost to Supabase redirect URLs
http://localhost:3000/*
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
```

### Test Scenarios

#### ✅ Sign Up
1. Go to `/auth/signup`
2. Enter email and password
3. Should redirect to `/dashboard`
4. Profile and subscription should be created

#### ✅ Sign In
1. Go to `/auth/signin`
2. Enter credentials
3. Should redirect to `/dashboard`
4. Session persists on page refresh

#### ✅ Password Reset
1. Go to `/auth/reset-password`
2. Enter email
3. Check email inbox
4. Click reset link
5. Should land on `/auth/update-password`
6. Enter new password
7. Should redirect to `/dashboard`

#### ✅ Protected Routes
1. Sign out (if signed in)
2. Try to visit `/dashboard`
3. Should redirect to `/auth/signin?redirect=/dashboard`
4. Sign in
5. Should redirect back to `/dashboard`

#### ✅ Email Confirmation (if enabled)
1. Sign up new account
2. Check email inbox
3. Click confirmation link
4. Should redirect to `/auth/callback`
5. Then redirect to `/dashboard`

## ⚠️ Common Issues & Solutions

### Issue: "Invalid redirect URL"

**Cause:** The redirect URL is not in Supabase's allowed list

**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add the URL to "Redirect URLs"
3. Save and try again

### Issue: Email links redirect to wrong domain

**Cause:** Site URL not set correctly

**Solution:**
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Ensure "Site URL" is `https://stagetechpro.online`
3. Update email templates to use `{{ .ConfirmationURL }}`

### Issue: Session not persisting

**Cause:** Cookie issues or middleware blocking

**Solution:**
1. Check browser cookies are enabled
2. Verify middleware allows `/auth/callback`
3. Check `NEXT_PUBLIC_SITE_URL` matches current domain

### Issue: "Failed to fetch" on localhost

**Cause:** CORS or localhost not in redirect URLs

**Solution:**
1. Add `http://localhost:3000/*` to redirect URLs
2. Ensure `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`

### Issue: Preview deployments not working

**Cause:** Vercel preview URLs not in redirect list

**Solution:**
1. Add `https://*.vercel.app/*` to redirect URLs
2. This allows all Vercel preview domains

## 🚀 Deployment Checklist

### Before Deploying to Production

- ✅ Site URL set to `https://stagetechpro.online`
- ✅ All redirect URLs added to Supabase
- ✅ Email templates updated with production URL
- ✅ Environment variables set in Vercel
- ✅ `NEXT_PUBLIC_SITE_URL` set to production domain
- ✅ Test signup flow
- ✅ Test signin flow
- ✅ Test password reset flow
- ✅ Test protected routes
- ✅ Verify email sending works

### After Deployment

1. **Test signup** on production domain
2. **Verify email** received and link works
3. **Test login** on production
4. **Test password reset** on production
5. **Check session persistence** (refresh page while logged in)
6. **Verify protected routes** redirect properly

## 📞 Support Resources

### Supabase Documentation

- [Auth Configuration](https://supabase.com/docs/guides/auth/auth-config)
- [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

### StageTechPro Files

- `middleware.ts` - Route protection
- `lib/supabase-browser.ts` - Browser auth client
- `lib/supabase-server.ts` - Server auth client
- `lib/auth-context.tsx` - Auth state management
- `app/auth/callback/route.ts` - OAuth/email callback handler
- `app/auth/signin/page.tsx` - Sign in page
- `app/auth/signup/page.tsx` - Sign up page
- `app/auth/reset-password/page.tsx` - Password reset request
- `app/auth/update-password/page.tsx` - Password update form

## 🔒 Security Best Practices

1. **Never commit secrets** to Git
2. **Use environment variables** for all keys
3. **Enable email confirmation** for production (optional)
4. **Set rate limits** to prevent abuse
5. **Monitor auth logs** in Supabase Dashboard
6. **Use strong password requirements** (already implemented)
7. **Keep service role key** server-side only
8. **Regularly rotate** API keys

## 📝 Summary

**Your auth system uses:**
- ✅ Supabase Auth exclusively
- ✅ Email/password authentication
- ✅ Secure session management via cookies
- ✅ Protected routes via Next.js middleware
- ✅ Production domain: `https://stagetechpro.online`
- ✅ Email redirects properly configured
- ✅ No hardcoded URLs

**Required Supabase settings:**
- Site URL: `https://stagetechpro.online`
- Redirect URLs: All production and preview URLs listed
- Email templates: Use `{{ .ConfirmationURL }}` variable
- Providers: Email provider enabled

**All authentication flows work correctly:**
- ✅ Signup → Dashboard
- ✅ Login → Dashboard
- ✅ Password reset → Update password → Dashboard
- ✅ Protected routes → Sign in → Original route
- ✅ Email confirmation → Callback → Dashboard

---

**Last Updated:** November 22, 2025
**Production Domain:** https://stagetechpro.online
**Supabase Project:** qnwcbenxwzwdwcdiwrph
