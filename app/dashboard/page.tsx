"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { ProtectedRoute } from "@/components/auth/protected-route";
import * as Icons from "lucide-react";

function DashboardContent() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [requestedTools, setRequestedTools] = useState<Set<string>>(new Set());
  const { user, subscription, isTrialExpired } = useAuth();

  useEffect(() => {
    const loadRequestedTools = async () => {
      if (user) {
        const requests = await Promise.all(
          tools
            .filter((t) => t.status === "coming_soon")
            .map((t) => dbService.hasRequestedTool(user.id, t.id))
        );
        const requestedSet = new Set<string>();
        tools
          .filter((t) => t.status === "coming_soon")
          .forEach((t, index) => {
            if (requests[index]) {
              requestedSet.add(t.id);
            }
          });
        setRequestedTools(requestedSet);
      }
    };
    loadRequestedTools();
  }, [user]);

  const handleRequestPriority = async (toolId: string) => {
    if (!user) return;
    try {
      await dbService.createInterestRequest({
        user_id: user.id,
        tool_id: toolId,
      });
      setRequestedTools((prev) => new Set(prev).add(toolId));
      await dbService.createAuditLog({
        user_id: user.id,
        action: "tool_requested",
        tool_id: toolId,
      });
    } catch (error) {
      console.error("Failed to request priority:", error);
    }
  };

  const filtered = useMemo(
    () =>
      tools.filter(
        (t) =>
          (cat === "all" || t.category === cat) &&
          (t.name.toLowerCase().includes(q.toLowerCase()) ||
            t.description.toLowerCase().includes(q.toLowerCase()))
      ),
    [q, cat]
  );

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {isTrialExpired && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-yellow-300">
              Your trial has expired. Upgrade to continue using all features.{" "}
              <Link href="/#pricing" className="underline font-bold">
                View Plans
              </Link>
            </p>
          </div>
        )}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-3">
            Tool Dashboard
          </h1>
          <p className="text-gray-300">Search and filter through all tools</p>
        </div>

        <div className="glass-panel p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Search tools..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={cat === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCat("all")}
              >
                All
              </Button>
              {[
                "universals",
                "audio",
                "lighting",
                "video",
                "planning",
                "networking",
                "utility",
                "nice-to-have",
              ].map((c) => (
                <Button
                  key={c}
                  variant={cat === c ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCat(c)}
                  className="capitalize"
                >
                  {c.replace("-", " ")}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => {
            const IconComponent = (Icons as any)[t.icon] || Icons.Box;
            return (
              <div key={t.id} className="glass-panel p-6 hover:shadow-glow transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                    <IconComponent className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-sm">
                    {t.status === "available" ? (
                      <span className="text-cyan-300 font-medium">Available</span>
                    ) : (
                      <span className="text-gray-400">Coming Soon</span>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{t.description}</p>
                {t.status === "available" ? (
                  <Link href={`/tools/${t.id}`}>
                    <Button className="w-full">Open Tool</Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleRequestPriority(t.id)}
                    disabled={requestedTools.has(t.id)}
                  >
                    {requestedTools.has(t.id) ? "Requested" : "Request Priority"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
