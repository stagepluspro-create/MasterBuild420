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

- Node.js 18+ and npm 9+
- Supabase account
- EmailJS account (for invitations)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/stagepluspro-create/MasterBuild420.git
cd MasterBuild420
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
- `NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID`
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

4. Run database migrations:
```bash
# Migrations are in /supabase/migrations/
# Apply via Supabase Dashboard or CLI
```

5. Start development server:
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📦 Build Commands

```bash
npm run dev         # Start dev server (port 3000)
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint validation
npm run typecheck   # TypeScript validation
npm run clean-port  # Kill stale Next.js processes
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

- **Supabase Auth** with email/password + Google OAuth
- **Row-Level Security (RLS)** on all tables
- **PKCE flow** for secure token exchange
- **Environment variables** never exposed to client
- **API keys** properly gitignored

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

18 migrations covering:
- Users, teams, projects
- Presets with sharing 
- Team invitations
- Power plans, DMX fixtures
- SPL measurements
- Patch lists with channels
- Comprehensive RLS policies

## 🌐 Deployment

### Production Checklist

- [x] All TypeScript errors resolved
- [x] All ESLint warnings fixed
- [x] Production build succeeds (65 pages)
- [x] Environment variables configured
- [x] Database migrations applied
- [x] PWA manifest and icons ready
- [x] Error boundaries implemented
- [x] Loading states configured
- [x] SEO files (robots.txt, sitemap.xml)
- [x] Security audit passed (0 vulnerabilities)

### Deploy to Vercel

```bash
npm run build
# Deploy via Vercel CLI or GitHub integration
# Configure environment variables in Vercel Dashboard
# Point domain: stagetechpro.online
```

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
