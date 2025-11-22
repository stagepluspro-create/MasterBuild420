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

## User Preferences
None documented yet.

## Project Status
✅ Import complete and running successfully
✅ Development server functional on port 5000
✅ Environment variables configured
✅ Deployment configuration set up
✅ Application homepage verified and working
