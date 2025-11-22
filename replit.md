# Stage Tech Pro - Replit Project

## Project Overview
Stage Tech Pro is a comprehensive SaaS platform for live production professionals, providing 35+ specialized tools for audio, lighting, video, planning, networking, and utility workflows.

## Technology Stack
- **Frontend Framework**: Next.js 14.2.33 (App Router)
- **Runtime**: Node.js 20.19.3
- **UI Library**: React 18.2.0
- **Styling**: Tailwind CSS 3.4.14, Shadcn/UI components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Animation**: Framer Motion
- **Package Manager**: npm 10.8.2

## Project Structure
- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components (layout, teams, tools, ui primitives)
- `/modules` - Tool implementations (35+ production tools)
- `/lib` - Core utilities (auth, database, services)
- `/supabase/migrations` - Database schema migrations
- `/public` - Static assets, PWA manifest, service worker

## Environment Configuration

### Required Environment Variables
The following environment variables are configured in Replit (shared environment):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public/anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `SUPABASE_JWT_SECRET` - JWT secret for token verification
- `NEXT_PUBLIC_SITE_URL` - Application URL (set to Replit domain)

### Optional Environment Variables
For team invitation features (EmailJS):
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
- `NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID`
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

## Development Setup

### Running the Application
The application runs on port 5000 with the following configuration:
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Port**: 5000 (required for Replit webview)
- **Command**: `npm run dev`

The workflow "Start application" is configured to run the dev server automatically.

### Important Configuration Notes
1. **Replit Proxy Support**: The Next.js config includes `allowedDevOrigins` to support Replit's proxy environment
2. **Host Configuration**: The dev server binds to 0.0.0.0 to allow external access through Replit's infrastructure
3. **Telemetry**: Next.js telemetry is disabled in the dev script

### Database
- Uses existing Supabase instance (DO NOT create new project)
- Database has 51 pre-configured tables
- All migrations located in `/supabase/migrations`
- Use `npm run validate-schema` to verify database integrity

## Deployment Configuration
- **Target**: Autoscale (stateless web application)
- **Build**: `npm run build`
- **Start**: `npm start` (runs on port 5000)
- **Environment**: All environment variables must be set in production environment

## Key Features
- 35+ professional production tools across 6 categories
- Real-time collaboration with team workspaces
- Cloud sync via Supabase
- Offline-first PWA capabilities
- Dark Fusion Neon UI theme
- Subscription-based access (Pro: $9.99/mo, Team: $99.99/mo)

## Recent Changes (November 22, 2025)
- Configured for Replit environment
- Updated to Node.js 20.19.3 (from 18.x)
- Modified dev server to run on 0.0.0.0:5000
- Added Replit proxy support via `allowedDevOrigins`
- Removed problematic predev script that was causing workflow failures
- Configured deployment settings for autoscale
- Set up environment variables for Supabase integration

### Security & Business Model Implementation
- **Locked all tools behind authentication** - `/tools/*` routes now require login
- **Enforced subscription/trial validation** - Middleware checks both authentication AND active subscription/trial status
- **Created marketing tools page** - `/tools` shows all tools with "Sign Up to Access" CTAs and feature previews
- **Preserved authenticated dashboard** - `/dashboard` provides tool access for subscribed users
- **Trial enforcement** - Users get 7-day free trial, must upgrade after expiration to continue accessing tools
- **Proper redirect flow** - Unauthenticated access redirects to signup, expired trials redirect to pricing

### Critical SSR/Database Fix (November 22, 2025)
- **Fixed SSR localStorage crash** - All service files (`haze-service`, `dmx-service`, `team-service`, `invitation-service`, `patchlist-service`, `db-service`) were creating Supabase browser client at module scope, causing `ReferenceError: localStorage is not defined` during SSR
- **Solution implemented** - Refactored all services to use `getSupabase()` helper function that creates client inside function bodies, preventing SSR access to browser APIs
- **Database operations verified** - All CRUD operations (create, read, update, delete) work correctly in browser context
- **Production ready** - Application compiles successfully without SSR errors

### Tool Verification Summary
**Heavy Tools Audited:**
- ✅ Haze & Atmosphere Simulator - Complete Supabase persistence (venues, machines, vents, fixtures, simulations)
- ✅ Spectrum Analyzer + RMS Meter - Standard Web Audio API with FFT (512-8192 bins), RMS metering, spectrogram
- ✅ Multi-Console Translator - Full grandMA2 parser with fixture mapping, DMX addressing, cue conversion

**Calculator Tools - Industry Standards Verified:**
- ✅ DMX Calculator - DMX512 compliant (1-512 channels, universe validation, MA3/ETC/Chamsys exports)
- ✅ Power Calculator - Correct electrical formulas (Single: P=V×I×PF, Three-phase: P=√3×V×I×PF)
- ✅ SPL Meter - Proper acoustics (RMS, dB conversion, A/C weighting, LEQ measurement)

## User Preferences
None documented yet.

## Project Status
✅ Import complete and running successfully
✅ Development server functional on port 5000
✅ Environment variables configured
✅ Deployment configuration set up
✅ Application homepage verified and working
