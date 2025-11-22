"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TOOLS,
  TOOL_CATEGORIES,
  type ToolCategory,
  type ToolMeta,
} from "@/lib/tools-meta";
import {
  Search,
  Lightbulb,
  Volume2,
  Radio,
  Layout,
  Network,
  Video,
  ArrowRight,
  Crown,
  Lock,
} from "lucide-react";

const CATEGORY_ICONS: Record<ToolCategory, any> = {
  lighting: Lightbulb,
  audio: Volume2,
  console: Radio,
  planning: Layout,
  network: Network,
  video: Video,
};

const CATEGORY_COLORS: Record<ToolCategory, string> = {
  lighting: "from-cyan-500/20 to-blue-500/20 border-cyan-400/30",
  audio: "from-violet-500/20 to-purple-500/20 border-violet-400/30",
  console: "from-orange-500/20 to-red-500/20 border-orange-400/30",
  planning: "from-green-500/20 to-emerald-500/20 border-green-400/30",
  network: "from-blue-500/20 to-cyan-500/20 border-blue-400/30",
  video: "from-pink-500/20 to-rose-500/20 border-pink-400/30",
};

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | "all">("all");

  const filteredTools = useMemo(() => {
    let tools = TOOLS;

    // Filter by category
    if (selectedCategory !== "all") {
      tools = tools.filter((tool) => tool.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.shortDescription.toLowerCase().includes(query) ||
          tool.longDescription.toLowerCase().includes(query)
      );
    }

    return tools;
  }, [searchQuery, selectedCategory]);

  const categories = Object.entries(TOOL_CATEGORIES) as [ToolCategory, typeof TOOL_CATEGORIES[ToolCategory]][];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
            Professional Tools
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            30+ specialized tools for lighting, audio, video, and production professionals. All in your browser, ready when you need them.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-12">
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tools by name or function..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-white/5 border-white/10 focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={selectedCategory === "all" ? "bg-gradient-to-r from-cyan-500 to-violet-500" : "border-white/20"}
            >
              All Tools ({TOOLS.length})
            </Button>
            {categories.map(([key, category]) => {
              const Icon = CATEGORY_ICONS[key];
              const count = TOOLS.filter((t) => t.category === key).length;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "outline"}
                  onClick={() => setSelectedCategory(key)}
                  className={selectedCategory === key ? "bg-gradient-to-r from-cyan-500 to-violet-500" : "border-white/20"}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.name} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => {
            const Icon = CATEGORY_ICONS[tool.category];
            return (
              <Link key={tool.id} href={`/tools/${tool.slug}`}>
                <Card className={`glass-panel border transition-all hover:border-cyan-400/50 h-full group cursor-pointer ${CATEGORY_COLORS[tool.category]}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[tool.category]} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        {tool.isPro && (
                          <Badge variant="outline" className="border-violet-400/50 text-violet-400 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Pro
                          </Badge>
                        )}
                        {tool.requiresAuth && (
                          <Badge variant="outline" className="border-orange-400/50 text-orange-400 text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Login
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-cyan-400 transition-colors">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {tool.shortDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-white/10">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-4">No tools found matching your search.</p>
            <Button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20 p-12 glass-panel rounded-2xl border-cyan-400/30 text-center">
          <h2 className="text-3xl font-bold gradient-text mb-4">
            Unlock the Full Potential
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Sign up for StageTechPro to save presets, sync across devices, and access team collaboration features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
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
  );
}
