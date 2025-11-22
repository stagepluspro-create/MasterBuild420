# Stage Tech Pro — The Production Toolkit 

A next-generation, all-in-one web platform for live production professionals, providing 35+ specialized tools for audio, lighting, video, planning, networking, and utility workflows.

## 🎯 Overview 

Stage Tech Pro is a comprehensive SaaS platform designed for audio engineers, lighting designers, video operators, stage managers, and production technicians. It consolidates industry-standard calculations, planning tools, and workflow utilities into a single, unified dashboard.

### Key Features

- **35+ Professional Tools** across 6 categories
- **Real-time Collaboration** with team workspaces (up to 30 members)
- **Cloud Sync** for presets and project data
- **Offline-First PWA** installable on desktop and mobile
- **Dark Fusion Neon UI** optimized for production environments
- **Supabase Backend** with Row-Level Security

## 🛠 Technology Stack

- **Frontend:** Next.js 14.2 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS 3.4, Shadcn/UI, Framer Motion
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Payments:** PayPal Hosted Buttons
- **Hosting:** Vercel
- **Domain:** stagetechpro.online

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **Supabase account** (free tier works)
- **EmailJS account** (optional, for team invitations only)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/stagepluspro-create/MasterBuild420.git
cd MasterBuild420
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```bash
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Your site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional (for team invitations)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

4. **Set up Supabase database:**

   a. **IMPORTANT:** Use the existing Supabase instance from `.env`
      - DO NOT create a new Supabase project
      - The database is already configured with 51 tables
      - All migrations have been applied

   b. **Verify schema integrity:**
      ```bash
      npm install
      npm run validate-schema
      ```
      This will verify:
      - All 51 required tables exist
      - All RLS policies are in place
      - No hashed/corrupted table names
      - Database functions are present

   c. **If starting fresh** (new Supabase project):
      - Apply migrations in chronological order from `/supabase/migrations/`
      - Use Supabase SQL Editor or CLI
      - Run `npm run validate-schema` after to confirm

5. **Start development server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

**First Time Setup:**
- Navigate to `/auth/signup` to create an account
- A profile and trial subscription will be auto-created
- You'll be redirected to `/dashboard`

## 📦 Build Commands

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint validation
npm run typecheck        # TypeScript validation
npm run clean-port       # Kill stale Next.js processes
npm run validate-schema  # Verify Supabase schema integrity
```

## 🏗 Project Structure

```
/app                    # Next.js App Router pages
  /auth                 # Authentication flows
  /dashboard            # Main dashboard
  /teams                # Team management
  /tools/[toolId]       # Dynamic tool pages
  /profile              # User settings
  layout.tsx            # Root layout
  error.tsx             # Global error boundary
  loading.tsx           # Loading state
  not-found.tsx         # 404 page

/components             # Reusable UI components
  /layout               # Nav, Footer
  /teams                # Team components
  /tools                # Tool-specific components
  /ui                   # Shadcn UI primitives

/modules                # Tool implementations
  /dmx-calculator       # DMX addressing tool
  /spl-meter            # SPL measurement
  /power-calculator     # Electrical calculations
  /patch-list           # Signal routing
  ... (35+ tools)

/lib                    # Core utilities
  auth-context.tsx      # Auth provider
  supabase.ts           # Database client
  db-service.ts         # CRUD operations
  tools.ts              # Tool registry

/supabase/migrations    # Database schema (34 migrations)

/public                 # Static assets
  manifest.json         # PWA manifest
  sw.js                 # Service worker
  robots.txt            # SEO
  sitemap.xml           # Sitemap
```

## 🧰 Tool Categories

### Audio (6 tools)
- SPL Meter, Tone Generator, Signal Tester, RF Coordination, Playback Cues, Metronome/Tuner

### Lighting (5 tools)
- DMX Calculator, Photometrics, Color Tools, Fixture Library, Console Remotes

### Video (5 tools)
- Aspect/Framerate Calculator, Test Patterns, LUT Viewer, Teleprompter, ND/Exposure Helper

### Planning (4 tools)
- Stage Plot Designer, Patch List Generator, Callsheet Builder, Label Maker

### Networking (4 tools)
- IP Scanner, Speed Test, Ping/Traceroute, Router Control

### Utility (11 tools)
- Power Calculator, Budget Tracker, Inventory Manager, Task Tracker, and more

## 🔐 Authentication & Security

### How Auth Works

**StageTechPro uses Supabase Auth exclusively** - no Bolt DB, no custom backend.

1. **Sign Up/Sign In:** Users authenticate via Supabase email/password
2. **Session Management:** Handled by `@supabase/ssr` with cookie-based sessions
3. **Middleware Protection:** `middleware.ts` protects `/profile`, `/teams`, `/dashboard`, `/tools`
4. **Client State:** `AuthProvider` (lib/auth-context.tsx) provides user, profile, subscription
5. **Server Queries:** Server components use `lib/supabase-server.ts` for database access

### Security Features

- ✅ **Row-Level Security (RLS)** enforced on ALL tables
- ✅ **Secure session cookies** managed by Next.js middleware
- ✅ **Environment variables** properly separated (public vs private)
- ✅ **No service role key** exposed to client
- ✅ **CSRF protection** via Supabase PKCE flow
- ✅ **No deprecated auth helpers** - uses latest `@supabase/ssr`

## 🎨 Design System — Dark Fusion Neon

- **Base Gradient:** #050510 → #0B0C1A → #121227
- **Neon Accents:** Cyan (#00E8FF), Violet (#9B5CFF), Magenta (#FF008C)
- **Fonts:** Outfit (headings), Inter (body)
- **Glassmorphic panels** with blur + subtle borders
- **Smooth animations:** fadeIn, slideIn, pulseGlow

## 💳 Subscription Tiers

- **Pro:** $9.99/mo (1 member, 7-day trial)
- **Team:** $99.99/mo (30 members, 7-day trial)

Both tiers include:
- All 35+ tools
- Cloud sync
- Offline access
- Priority support

## 📱 PWA Features

- **Installable** on desktop and mobile
- **Offline-first** with service worker caching
- **App-like experience** with standalone display
- **Optimized icons** for all platforms

## 🔧 Database Schema

### Current Status
- **51 tables** with clean, human-readable names
- **196 RLS policies** protecting all data
- **2 database functions** for team permissions
- **NO hashed or corrupted tables**
- **Single source of truth:** Supabase instance at NEXT_PUBLIC_SUPABASE_URL

### Schema Categories

**Core (4 tables):** profiles, subscriptions, subscription_changes, audit_log
**Teams (8 tables):** teams, team_members, team_roles, team_api_keys, etc.
**Projects (4 tables):** projects, project_files, tasks, documents
**Tools (35+ tables):** DMX calculator, haze simulator, console translator, patch lists, power plans, budget tracker, SPL meter, etc.

### Migrations

All migrations are stored in `/supabase/migrations/` and applied in chronological order:

1. `20251121231229_create_missing_tables_and_fix_rls_policies.sql` - Initial schema
2. `20251122001941_add_subscription_changes_table.sql` - Audit trail
3. `20251122013850_add_team_permission_functions.sql` - Helper functions
4. `20251122015356_fix_team_member_insert_policy.sql` - RLS fix
5. `20251122030000_schema_documentation.sql` - Schema lock

### Schema Safety

**⚠️ Critical Rules:**
- DO NOT create new Supabase projects
- DO NOT duplicate or regenerate tables
- DO NOT use hashed table names
- ALWAYS use the existing Supabase instance
- ALWAYS add new changes via migrations
- ALWAYS run `npm run validate-schema` before deploying

**✅ Safe Operations:**
- Adding new migrations for schema changes
- Updating RLS policies via migrations
- Creating indexes for performance
- Adding new tables via migrations

## 🌐 Deployment to Vercel

### Pre-Deployment Checklist

1. **✅ Verify build succeeds locally:**
```bash
npm run build
npm run lint
npm run typecheck
npm run validate-schema
```

2. **✅ Confirm environment variables are set:**
   - Check `.env.local` has all required values
   - Never commit `.env.local` to git!

3. **✅ Verify Supabase schema:**
   - Schema validation passes (green checkmarks)
   - All 51 tables exist
   - All 196 RLS policies in place
   - No hashed table names

### Deploy Steps

#### Option 1: Vercel GitHub Integration (Recommended)

1. Push code to GitHub:
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. Connect repository to Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration

3. Configure Environment Variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g., https://stagetechpro.online)
   - Optional: EmailJS variables for team invitations

4. Deploy:
   - Click "Deploy"
   - Wait for build to complete
   - Vercel provides preview URL

5. Configure Custom Domain:
   - Add `stagetechpro.online` in Vercel Domains settings
   - Update DNS records with your registrar
   - Wait for SSL certificate to provision (automatic)

#### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Post-Deployment

1. **Test authentication:**
   - Sign up at `/auth/signup`
   - Verify profile creation
   - Check subscription trial starts

2. **Verify tools work:**
   - Test DMX Calculator
   - Test SPL Meter
   - Check data persistence

3. **Monitor errors:**
   - Check Vercel logs for any issues
   - Watch Supabase Dashboard for query errors

### Environment Variables Reference

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-only!)
- `NEXT_PUBLIC_SITE_URL` - Your deployed URL

**Optional:**
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID` - For team invitations
- `NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID` - EmailJS template
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` - EmailJS public key

### Production Checklist

- ✅ All TypeScript errors resolved
- ✅ All ESLint warnings fixed
- ✅ Production build succeeds (77 pages)
- ✅ Environment variables configured in Vercel
- ✅ Database migrations applied to Supabase
- ✅ RLS policies enabled on all tables
- ✅ PWA manifest and icons ready
- ✅ Error boundaries implemented
- ✅ Loading states configured
- ✅ SEO files (robots.txt, sitemap.xml) in place
- ✅ Custom domain configured with SSL
- ✅ No Bolt DB dependencies
- ✅ Using `@supabase/ssr` (not deprecated helpers)

## 🤝 Contributing

This is a private production repository. Internal contributions only.

## 📄 License

Proprietary — All rights reserved.

## 🐛 Bug Reports

Submit via in-app "Report Bug" form or email: support@stagetechpro.online

## 📞 Contact

- **Website:** https://stagetechpro.online
- **Email:** support@stagetechpro.online
- **GitHub:** https://github.com/stagepluspro-create/MasterBuild420

---

**Version:** 1.0.0
**Last Updated:** November 16, 2025
**Next.js:** 14.2.33
**Status:** Production Ready ✅
