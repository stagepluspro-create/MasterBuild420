"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Users,
  Crown,
  Lightbulb,
  Volume2,
  Radio,
  Layout,
  Network,
  Video,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Cloud,
  Timer,
  BarChart3,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,232,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(155,92,255,0.1),transparent_50%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border-cyan-400/30 text-cyan-400">
            <Sparkles className="w-3 h-3 mr-1" />
            30+ Professional Tools
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">All-in-one tools</span>
            <br />
            for Stage, Audio & Production Pros
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            StageTechPro gives you 30+ professional tools for lighting techs, audio engineers, and production teams — all in your browser, ready when you need them.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/tools">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 hover:border-cyan-400/50">
                Browse Tools
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-400">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Tool Categories Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Everything You Need, One Platform
            </h2>
            <p className="text-xl text-gray-400">
              Professional-grade tools organized by your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Lighting Tools */}
            <Card className="glass-panel border-cyan-400/20 hover:border-cyan-400/50 transition-all group">
              <CardHeader>
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-8 h-8 text-cyan-400" />
                </div>
                <CardTitle className="text-2xl">Lighting Tools</CardTitle>
                <CardDescription className="text-base">
                  DMX, fixtures, photometrics, and lighting design
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    DMX Calculator & Addressing
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Power Distribution Calculator
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Photometrics & Throw Distance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    Haze & Atmosphere Simulator
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Audio Tools */}
            <Card className="glass-panel border-violet-400/20 hover:border-violet-400/50 transition-all group">
              <CardHeader>
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Volume2 className="w-8 h-8 text-violet-400" />
                </div>
                <CardTitle className="text-2xl">Audio Tools</CardTitle>
                <CardDescription className="text-base">
                  Sound level meters, analyzers, and audio utilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                    SPL Meter & RMS Monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                    Spectrum Analyzer (FFT)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                    Tone Generator & Signal Tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-400" />
                    RF Coordination & Wireless
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Console Tools */}
            <Card className="glass-panel border-orange-400/20 hover:border-orange-400/50 transition-all group">
              <CardHeader>
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Radio className="w-8 h-8 text-orange-400" />
                </div>
                <CardTitle className="text-2xl">Console & Showfile</CardTitle>
                <CardDescription className="text-base">
                  Cross-console translators and file utilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    Multi-Console Translator
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    Patch List Manager
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    Console Remote Control
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400" />
                    Showfile Backup & Export
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Planning Tools */}
            <Card className="glass-panel border-green-400/20 hover:border-green-400/50 transition-all group">
              <CardHeader>
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Layout className="w-8 h-8 text-green-400" />
                </div>
                <CardTitle className="text-2xl">Planning & Production</CardTitle>
                <CardDescription className="text-base">
                  Stage plots, task tracking, and production docs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Stage Plot Designer
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Task Tracker & Checklists
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Budget Tracker
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Call Sheet Builder
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Network Tools */}
            <Card className="glass-panel border-blue-400/20 hover:border-blue-400/50 transition-all group">
              <CardHeader>
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Network className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-2xl">Network & System</CardTitle>
                <CardDescription className="text-base">
                  Signal testing and network utilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Signal Path Tester
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Network Diagnostics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Cable Testing Tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    System Commissioning
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Video Tools */}
            <Card className="glass-panel border-pink-400/20 hover:border-pink-400/50 transition-all group">
              <CardHeader>
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Video className="w-8 h-8 text-pink-400" />
                </div>
                <CardTitle className="text-2xl">Video & Broadcast</CardTitle>
                <CardDescription className="text-base">
                  Test patterns, color tools, and video utilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                    Test Pattern Generator
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                    LUT & Color Reference
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                    Aspect Ratio Calculator
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-400" />
                    Teleprompter
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/tools">
              <Button size="lg" variant="outline" className="border-white/20 hover:border-cyan-400/50">
                View All 30+ Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Tools Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Flagship Tools
            </h2>
            <p className="text-xl text-gray-400">
              Industry-leading utilities trusted by professionals worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-panel border-white/10 hover:border-cyan-400/50 transition-all">
              <CardHeader>
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 w-fit mb-3">
                  <Cloud className="w-10 h-10 text-cyan-400" />
                </div>
                <CardTitle className="text-xl">Haze & Atmosphere Simulator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Physics-based haze dispersion modeling for venue planning. Simulate different haze machines and atmospheric conditions.
                </p>
                <Link href="/tools/haze-simulator">
                  <Button variant="outline" size="sm" className="w-full">
                    Learn More
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/10 hover:border-violet-400/50 transition-all">
              <CardHeader>
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 w-fit mb-3">
                  <BarChart3 className="w-10 h-10 text-violet-400" />
                </div>
                <CardTitle className="text-xl">Spectrum Analyzer + RMS Meter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Real-time FFT analysis with SPL monitoring. Perfect for system tuning, feedback hunting, and acoustic analysis.
                </p>
                <Link href="/tools/spectrum-analyzer">
                  <Button variant="outline" size="sm" className="w-full">
                    Learn More
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/10 hover:border-orange-400/50 transition-all">
              <CardHeader>
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 w-fit mb-3">
                  <Radio className="w-10 h-10 text-orange-400" />
                </div>
                <CardTitle className="text-xl">Multi-Console Translator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Convert showfiles between MA2, MA3, Hog, Avo, and more. Preserve patch data, groups, and presets across platforms.
                </p>
                <Link href="/tools/console-translator">
                  <Button variant="outline" size="sm" className="w-full">
                    Learn More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Your Complete Workflow
            </h2>
            <p className="text-xl text-gray-400">
              From pre-production to showtime
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 mb-6">
                <Layout className="w-16 h-16 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">1. Plan</h3>
              <p className="text-gray-300">
                Design stage plots, calculate power and DMX, plan RF spectrum, and create production documentation.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 mb-6">
                <Radio className="w-16 h-16 text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">2. Program</h3>
              <p className="text-gray-300">
                Translate showfiles, manage patch lists, create presets, and prepare your console for the show.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex p-6 rounded-2xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 mb-6">
                <Zap className="w-16 h-16 text-pink-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">3. Run</h3>
              <p className="text-gray-300">
                Monitor SPL levels, analyze spectrum, test signals, and use real-time tools during your event.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="glass-panel border-cyan-400/30">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-3xl">Pro</CardTitle>
                  <Badge className="bg-cyan-500/20 border-cyan-400/50 text-cyan-400">
                    Most Popular
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold gradient-text">$9.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="text-base">
                  Perfect for individual professionals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">All 30+ professional tools</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">Cloud sync & presets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">Unlimited exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">Offline PWA support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass-panel border-violet-400/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold">
                BEST VALUE
              </div>
              <CardHeader className="pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <CardTitle className="text-3xl">Team</CardTitle>
                  <Crown className="w-6 h-6 text-violet-400" />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">$99.99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <CardDescription className="text-base">
                  Built for production teams
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-white font-medium">Everything in Pro, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-gray-300">Up to 30 team members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-gray-300">Shared projects & presets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-gray-300">Priority support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/20 hover:border-cyan-400/50">
                View Full Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-pink-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Ready to elevate your production workflow?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of professionals using StageTechPro worldwide
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-10 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-10 border-white/20 hover:border-cyan-400/50">
                Contact Sales
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
