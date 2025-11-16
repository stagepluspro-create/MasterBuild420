"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Layers, Wifi, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {}, []);

  return (
    <div className="min-h-screen">
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center fade-in">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">
                Professional Live Production Toolkit
              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Everything You Need</span>
            <br />
            <span className="text-white">For Live Events</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            35+ specialized tools for audio, lighting, video, planning, and networking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button className="px-8">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="px-8">
                Explore Tools
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400 mt-6">
            7-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Layers,
                title: "35+ Tools",
                description: "Complete toolkit for live production",
              },
              {
                icon: CheckCircle2,
                title: "Industry Standards",
                description: "AES, ESTA, SMPTE aligned",
              },
              {
                icon: Wifi,
                title: "Works Offline",
                description: "Installable PWA with caching",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Shared projects and presets",
              },
            ].map((f, i) => (
              <div key={i} className="glass-panel p-6 text-center slide-in">
                <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 mb-4">
                  <f.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300">Choose the plan that works for you</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="glass-panel p-8 rounded-2xl border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-1">Pro</h3>
              <p className="text-gray-300 mb-2 text-lg">$9.99/month</p>
              <ul className="space-y-2 text-gray-400 text-sm mb-6">
                <li>Access to all tools</li>
                <li>Unlimited exports</li>
                <li>Share links</li>
                <li>PWA offline</li>
                <li>Priority email support</li>
                <li>1 member</li>
              </ul>
              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
                    <style>.pp-BA5M2737P3VBE{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style>
                    <form action="https://www.paypal.com/ncp/payment/BA5M2737P3VBE" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
                      <input class="pp-BA5M2737P3VBE" type="submit" value="Buy Now" />
                      <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
                      <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section>
                    </form>
                  `,
                  }}
                />
              </div>
            </div>
            <div className="glass-panel p-8 rounded-2xl border border-cyan-400/40 shadow-[0_0_25px_rgba(0,255,255,0.15)]">
              <h3 className="text-2xl font-bold text-white mb-1">Team</h3>
              <p className="text-gray-300 mb-2 text-lg">$99.99/month</p>
              <ul className="space-y-2 text-gray-400 text-sm mb-6">
                <li>Everything in Pro</li>
                <li>Up to 30 members</li>
                <li>Shared projects</li>
                <li>Team stats</li>
                <li>Priority support</li>
                <li>Training</li>
              </ul>
              <div>
                <div
                  dangerouslySetInnerHTML={{
                    __html: `
                    <style>.pp-FEC47P2HBV9K6{text-align:center;border:none;border-radius:0.25rem;min-width:11.625rem;padding:0 2rem;height:2.625rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:1rem;line-height:1.25rem;cursor:pointer;}</style>
                    <form action="https://www.paypal.com/ncp/payment/FEC47P2HBV9K6" method="post" target="_blank" style="display:inline-grid;justify-items:center;align-content:start;gap:0.5rem;">
                      <input class="pp-FEC47P2HBV9K6" type="submit" value="Buy Now" />
                      <img src="https://www.paypalobjects.com/images/Debit_Credit_APM.svg" alt="cards" />
                      <section style="font-size: 0.75rem;"> Powered by <img src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-wordmark-color.svg" alt="paypal" style="height:0.875rem;vertical-align:middle;"/></section>
                    </form>
                  `,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
