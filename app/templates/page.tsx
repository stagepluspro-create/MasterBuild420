import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Lightbulb,
  Volume2,
  Layout,
  ClipboardCheck,
  DollarSign,
  Calendar,
} from "lucide-react";

const templates = [
  {
    slug: "stage-plot-template",
    title: "Stage Plot Template",
    description: "Professional stage plot template with standard symbols and measurements",
    category: "Planning",
    icon: Layout,
    format: "PDF",
    downloads: 1234,
  },
  {
    slug: "dmx-patch-sheet",
    title: "DMX Patch Sheet",
    description: "Comprehensive DMX patching template with universe management",
    category: "Lighting",
    icon: Lightbulb,
    format: "Excel",
    downloads: 2156,
  },
  {
    slug: "input-list-template",
    title: "Audio Input List",
    description: "Professional input list for live sound productions",
    category: "Audio",
    icon: Volume2,
    format: "Excel",
    downloads: 1876,
  },
  {
    slug: "advance-sheet",
    title: "Production Advance Sheet",
    description: "Complete advance sheet template for touring productions",
    category: "Planning",
    icon: FileText,
    format: "PDF",
    downloads: 987,
  },
  {
    slug: "load-in-checklist",
    title: "Load-In Checklist",
    description: "Comprehensive checklist for venue load-ins",
    category: "Planning",
    icon: ClipboardCheck,
    format: "PDF",
    downloads: 1543,
  },
  {
    slug: "equipment-inventory",
    title: "Equipment Inventory",
    description: "Track your gear with this inventory management template",
    category: "Planning",
    icon: ClipboardCheck,
    format: "Excel",
    downloads: 876,
  },
  {
    slug: "budget-template",
    title: "Production Budget",
    description: "Detailed budget tracking for events and tours",
    category: "Planning",
    icon: DollarSign,
    format: "Excel",
    downloads: 1432,
  },
  {
    slug: "call-sheet-template",
    title: "Call Sheet Template",
    description: "Professional call sheet for crew and cast",
    category: "Planning",
    icon: Calendar,
    format: "PDF",
    downloads: 2034,
  },
  {
    slug: "risk-assessment",
    title: "Risk Assessment Form",
    description: "Health and safety risk assessment template",
    category: "Planning",
    icon: ClipboardCheck,
    format: "PDF",
    downloads: 765,
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            Templates Library
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Professional templates for stage plots, patch lists, budgets, and production documentation. Download and customize for your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.slug} className="glass-panel border-white/10 hover:border-cyan-400/50 transition-all group">
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                      {template.format}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-cyan-400 transition-colors">
                    {template.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{template.category}</span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {template.downloads.toLocaleString()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-cyan-500/10 group-hover:border-cyan-400/50">
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 p-8 glass-panel rounded-xl border-cyan-400/30">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Need Custom Templates?</h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              StageTechPro Pro and Team subscribers can create and save custom templates directly in the app, with cloud sync and team sharing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-white/20 hover:border-cyan-400/50">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
