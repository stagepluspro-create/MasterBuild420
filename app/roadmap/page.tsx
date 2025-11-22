import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Sparkles, Wrench, Users, Zap } from "lucide-react";

const roadmapItems = {
  now: [
    {
      title: "Mobile App (iOS & Android)",
      description: "Native mobile apps for on-the-go access to all tools",
      category: "Platform",
      votes: 127,
    },
    {
      title: "Offline Mode Improvements",
      description: "Enhanced PWA capabilities for full offline functionality",
      category: "Platform",
      votes: 89,
    },
    {
      title: "API Access",
      description: "RESTful API for integrations and automation",
      category: "Platform",
      votes: 156,
    },
  ],
  next: [
    {
      title: "3D Venue Visualizer",
      description: "3D visualization of stage plots and lighting designs",
      category: "Lighting",
      votes: 203,
    },
    {
      title: "MIDI Control Support",
      description: "Control tools via MIDI devices for live operation",
      category: "Audio",
      votes: 142,
    },
    {
      title: "Advanced Team Analytics",
      description: "Usage analytics and insights for team administrators",
      category: "Teams",
      votes: 78,
    },
    {
      title: "More Console Formats",
      description: "Support for ETC Eos, Chamsys, and other platforms",
      category: "Console",
      votes: 167,
    },
    {
      title: "Custom Branding for Teams",
      description: "White-label options for large teams and rentals",
      category: "Teams",
      votes: 92,
    },
  ],
  later: [
    {
      title: "AI-Powered Patch Assistant",
      description: "Intelligent patch list generation and optimization",
      category: "Lighting",
      votes: 234,
    },
    {
      title: "Live Collaboration Mode",
      description: "Real-time collaborative editing of projects",
      category: "Teams",
      votes: 189,
    },
    {
      title: "Equipment Marketplace",
      description: "Buy, sell, and rent production equipment",
      category: "Platform",
      votes: 156,
    },
    {
      title: "Video Integration Tools",
      description: "NDI, SDI, and HDMI analysis tools",
      category: "Video",
      votes: 134,
    },
  ],
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            Product Roadmap
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See what we're working on and what's coming next. Your feedback shapes our priorities.
          </p>
        </div>

        {/* Now */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <Wrench className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Now</h2>
              <p className="text-gray-400">Currently in development</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {roadmapItems.now.map((item, idx) => (
              <Card key={idx} className="glass-panel border-green-400/30 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="border-green-400/50 text-green-400">
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Zap className="w-4 h-4 text-green-400" />
                      {item.votes} votes
                    </div>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Next */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Next</h2>
              <p className="text-gray-400">Planned for upcoming releases</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {roadmapItems.next.map((item, idx) => (
              <Card key={idx} className="glass-panel border-cyan-400/30 bg-cyan-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      {item.votes} votes
                    </div>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Later */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Later</h2>
              <p className="text-gray-400">Ideas and future possibilities</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {roadmapItems.later.map((item, idx) => (
              <Card key={idx} className="glass-panel border-violet-400/30 bg-violet-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="border-violet-400/50 text-violet-400">
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Zap className="w-4 h-4 text-violet-400" />
                      {item.votes} votes
                    </div>
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-8 glass-panel rounded-xl border-cyan-400/30 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Have a Feature Request?</h3>
          <p className="text-gray-300 mb-6">
            We'd love to hear your ideas! Feature voting and community input will be available soon.
          </p>
          <a href="/contact" className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-md text-white font-semibold hover:from-cyan-600 hover:to-violet-600 transition-all">
            Submit Feedback
          </a>
        </div>
      </div>
    </div>
  );
}
