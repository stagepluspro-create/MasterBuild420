# StageTechPro - Deployment Guide

This guide walks you through deploying StageTechPro to Vercel with Supabase.

## Prerequisites

- ✅ GitHub account
- ✅ Vercel account (free tier is fine)
- ✅ Supabase project created
- ✅ All environment variables ready

---

## Step 1: Prepare Supabase Database

### 1.1 Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name:** StageTechPro
   - **Database Password:** (save this securely!)
   - **Region:** Choose closest to your users
4. Wait for project to be ready (~2 minutes)

### 1.2 Get API Credentials

1. In your Supabase project, go to **Settings > API**
2. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJ...
   service_role key: eyJhbGciOiJ...
   ```
3. Save these for later

### 1.3 Run Database Migrations

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in Supabase Dashboard
2. Open each file in `/supabase/migrations/` folder
3. Copy the SQL content
4. Paste into SQL Editor
5. Click "Run"
6. Repeat for ALL migration files **in chronological order**

**Option B: Using Supabase CLI**

```bash
npm install -g supabase
supabase link --project-ref your-project-ref
supabase db push
```

### 1.4 Verify Tables Exist

Go to **Database > Tables** and confirm you see:
- `profiles`
- `subscriptions`
- `teams`
- `projects`
- `presets`
- `power_plans`
- `dmx_patches`
- `spl_measurements`
- And 20+ more tables

---

## Step 2: Prepare GitHub Repository

### 2.1 Commit Your Code

```bash
git add .
git commit -m "Production ready - cleaned for Vercel deployment"
git push origin main
```

### 2.2 Verify .gitignore

Ensure these are in `.gitignore`:
```
.env
.env.local
.env*.local
node_modules/
.next/
```

**CRITICAL:** Never commit `.env.local` or any file with secrets!

---

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Vercel auto-detects Next.js - no config needed

### 3.2 Configure Environment Variables

Before clicking Deploy, add these environment variables:

**Required Variables:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SITE_URL=https://stagetechpro.online
```

**Optional (for team invitations):**

```bash
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

⚠️ **IMPORTANT:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** - never expose this!
- Make sure each variable is on its own line in Vercel

### 3.3 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~5 minutes)
3. Vercel provides a preview URL like: `https://your-project.vercel.app`

---

## Step 4: Configure Custom Domain

### 4.1 Add Domain in Vercel

1. Go to your project in Vercel Dashboard
2. Click **"Settings" > "Domains"**
3. Enter: `stagetechpro.online`
4. Click "Add"

### 4.2 Update DNS Records

Vercel will show DNS records needed. In your domain registrar:

**For root domain (stagetechpro.online):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 Wait for SSL

- SSL certificate provisions automatically
- Usually takes 5-10 minutes
- Vercel handles HTTPS redirect automatically

---

## Step 5: Post-Deployment Verification

### 5.1 Test Authentication

1. Visit `https://stagetechpro.online/auth/signup`
2. Create a test account
3. Verify you're redirected to `/dashboard`
4. Check that profile was created in Supabase

### 5.2 Test Tools

Try these key tools:
- DMX Calculator
- SPL Meter
- Power Calculator
- Stage Plot Designer

### 5.3 Verify Data Persistence

1. Create a preset in any tool
2. Sign out
3. Sign back in
4. Verify preset is still there

### 5.4 Check Error Monitoring

1. Go to Vercel Dashboard > Logs
2. Monitor for any errors
3. Check Supabase Dashboard > Logs for database errors

---

## Step 6: Set Up Continuous Deployment

Good news! It's already set up. Every push to `main` branch will:

1. Trigger a new build on Vercel
2. Run `npm run build`
3. Deploy if successful
4. Automatically update `stagetechpro.online`

To deploy changes:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Watch the build progress in Vercel Dashboard.

---

## Common Issues & Fixes

### Issue: "Session missing" error

**Fix:** Check that middleware.ts is working:
```typescript
// In middleware.ts, ensure this line exists:
const { data: { user }, error } = await supabase.auth.getUser()
```

### Issue: Data not saving

**Fix:** Verify RLS policies in Supabase:
1. Go to **Database > Policies**
2. Ensure each table has SELECT/INSERT/UPDATE/DELETE policies
3. Check that policies reference `auth.uid()`

### Issue: Build fails on Vercel

**Fix:** Check Vercel build logs:
1. Look for TypeScript errors
2. Ensure all environment variables are set
3. Verify `npm run build` works locally

### Issue: 404 on tools pages

**Fix:** Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

### Issue: Auth redirect loop

**Fix:** Check middleware logic:
- Ensure `/auth/callback` is not redirected
- Verify `isAuthPage` logic is correct

---

## Environment Variables Checklist

Copy this to verify all vars are set in Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `NEXT_PUBLIC_EMAILJS_SERVICE_ID` (optional)
- [ ] `NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID` (optional)
- [ ] `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` (optional)

---

## Security Checklist

Before going live, verify:

- [ ] All tables have RLS enabled
- [ ] No hardcoded secrets in code
- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key is server-only
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] CORS is properly configured in Supabase

---

## Performance Monitoring

### Vercel Analytics (Built-in)

1. Go to Vercel Dashboard > Analytics
2. Monitor:
   - Page load times
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

### Supabase Monitoring

1. Go to Supabase Dashboard > Reports
2. Monitor:
   - Database query performance
   - API response times
   - Auth success rates

---

## Backup & Disaster Recovery

### Database Backups

Supabase automatically backs up your database:
- **Daily backups** retained for 7 days (free tier)
- **Point-in-time recovery** available on paid plans

To manually backup:
1. Go to **Database > Backups**
2. Click "Download Backup"

### Code Backups

Your code is safe in GitHub:
- Every commit is a backup point
- Use tags for releases:
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Support

If you need help:

1. Check Vercel logs: https://vercel.com/your-project/logs
2. Check Supabase logs: https://app.supabase.com/project/_/logs
3. Review this guide
4. Contact: support@stagetechpro.online

---

## Success! 🎉

Your StageTechPro platform is now live at:
**https://stagetechpro.online**

Users can:
- Sign up with email/password
- Get a 7-day free trial
- Access all 35+ professional tools
- Create teams and collaborate
- Save presets to the cloud

Enjoy your production-ready platform!
