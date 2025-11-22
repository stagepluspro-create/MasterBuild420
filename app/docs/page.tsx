import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Wrench,
  Users,
  Shield,
  CreditCard,
  ArrowRight,
  FileText,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

const docSections = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Quick start guide to using StageTechPro",
    icon: BookOpen,
    articles: [
      "Creating your account",
      "Navigating the interface",
      "Your first tool",
      "Keyboard shortcuts",
    ],
  },
  {
    slug: "tools-overview",
    title: "Tools Overview",
    description: "Learn about all available tools",
    icon: Wrench,
    articles: [
      "Lighting tools guide",
      "Audio tools guide",
      "Console translator",
      "Production planning",
    ],
  },
  {
    slug: "team-collaboration",
    title: "Team Collaboration",
    description: "Working with teams and sharing projects",
    icon: Users,
    articles: [
      "Creating a team",
      "Inviting members",
      "Shared presets",
      "Role permissions",
    ],
  },
  {
    slug: "account-billing",
    title: "Account & Billing",
    description: "Managing your subscription and account",
    icon: CreditCard,
    articles: [
      "Subscription plans",
      "Payment methods",
      "Canceling subscription",
      "Account settings",
    ],
  },
  {
    slug: "privacy-security",
    title: "Privacy & Security",
    description: "Data protection and security",
    icon: Shield,
    articles: [
      "Privacy policy",
      "Terms of service",
      "Data storage",
      "Security practices",
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    description: "Frequently asked questions",
    icon: HelpCircle,
    articles: [
      "General questions",
      "Technical support",
      "Billing questions",
      "Feature requests",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to know about using StageTechPro
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.slug} href={`/docs/${section.slug}`}>
                <Card className="glass-panel border-white/10 hover:border-cyan-400/50 transition-all h-full group cursor-pointer">
                  <CardHeader>
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 w-fit mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-cyan-400 transition-colors">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-gray-400 mb-4">
                      {section.articles.map((article, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-cyan-400" />
                          {article}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center text-cyan-400 text-sm group-hover:translate-x-2 transition-transform">
                      Read Documentation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 p-8 glass-panel rounded-xl border-cyan-400/30">
          <div className="flex items-start gap-4">
            <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
              <Lightbulb className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Need More Help?</h2>
              <p className="text-gray-300 mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex gap-4">
                <Link href="/contact">
                  <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 rounded-md text-white font-semibold hover:from-cyan-600 hover:to-violet-600 transition-all">
                    Contact Support
                  </button>
                </Link>
                <Link href="/faq">
                  <button className="px-6 py-2 border border-white/20 rounded-md text-white hover:border-cyan-400/50 transition-all">
                    View FAQ
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
