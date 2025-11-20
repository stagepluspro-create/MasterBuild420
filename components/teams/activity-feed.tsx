"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Activity, Download, Filter, Calendar, User, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { ActivityFeedItem } from "@/lib/team-service";

interface ActivityFeedProps {
  teamId: string;
  initialActivities: ActivityFeedItem[];
  onExport: (startDate?: string, endDate?: string) => Promise<string>;
}

export function ActivityFeed({ teamId, initialActivities, onExport }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>(initialActivities);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const supabase = createClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`team-${teamId}-activity`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_feed",
          filter: `team_id=eq.${teamId}`,
        },
        async (payload) => {
          // Fetch the complete activity with user and project data
          const { data: newActivity } = await supabase
            .from("activity_feed")
            .select(
              "*, user:profiles!activity_feed_user_id_fkey(full_name, email, avatar_url), project:projects(name)"
            )
            .eq("id", payload.new.id)
            .single();

          if (newActivity) {
            setActivities((prev) => [newActivity as ActivityFeedItem, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const filteredActivities = activities.filter((activity) => {
    const matchesAction = actionFilter === "all" || activity.action === actionFilter;
    const matchesUser = userFilter === "all" || activity.user_id === userFilter;
    const matchesResource = resourceFilter === "all" || activity.resource_type === resourceFilter;
    const matchesStartDate = !startDate || new Date(activity.created_at) >= new Date(startDate);
    const matchesEndDate = !endDate || new Date(activity.created_at) <= new Date(endDate);

    return matchesAction && matchesUser && matchesResource && matchesStartDate && matchesEndDate;
  });

  const actionTypes = Array.from(new Set(activities.map((a) => a.action)));
  const users = Array.from(
    new Map(activities.filter((a) => a.user).map((a) => [a.user_id, a.user])).entries()
  );
  const resourceTypes = Array.from(
    new Set(activities.map((a) => a.resource_type).filter(Boolean) as string[])
  );

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_feed")
        .select(
          "*, user:profiles!activity_feed_user_id_fkey(full_name, email, avatar_url), project:projects(name)"
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .range(offset + LIMIT, offset + LIMIT * 2 - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        setActivities((prev) => [...prev, ...(data as ActivityFeedItem[])]);
        setOffset((prev) => prev + LIMIT);
        setHasMore(data.length === LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const csvContent = await onExport(startDate, endDate);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `team-activity-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export activity feed:", error);
    } finally {
      setExporting(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("project")) return <FileText className="w-4 h-4" />;
    if (action.includes("member")) return <User className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("created") || action.includes("invited")) return "text-green-400";
    if (action.includes("deleted") || action.includes("removed")) return "text-red-400";
    if (action.includes("updated") || action.includes("changed")) return "text-yellow-400";
    return "text-cyan-400";
  };

  const formatAction = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Activity Feed
              </CardTitle>
              <CardDescription>Real-time updates from your team</CardDescription>
            </div>
            <Button onClick={handleExport} disabled={exporting} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {formatAction(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(([userId, user]) => (
                  <SelectItem key={userId} value={userId}>
                    {user?.full_name || user?.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {resourceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity list */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <Card className="glass-panel border-white/10">
            <CardContent className="py-12 text-center">
              <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No activity found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="glass-panel border-white/10 hover:border-white/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500">
                      {activity.user?.full_name
                        ? activity.user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : activity.user?.email?.slice(0, 2).toUpperCase() || "SYS"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          <span className="font-semibold">
                            {activity.user?.full_name || activity.user?.email || "System"}
                          </span>{" "}
                          <span className={getActionColor(activity.action)}>
                            {formatAction(activity.action)}
                          </span>
                          {activity.project && (
                            <span className="text-gray-400"> in {activity.project.name}</span>
                          )}
                        </p>

                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 p-2 bg-white/5 rounded text-xs text-gray-400">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-500">{key}:</span>{" "}
                                <span className="text-gray-300">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {getRelativeTime(activity.created_at)}
                        </Badge>
                        {activity.resource_type && (
                          <Badge variant="outline" className="text-xs">
                            {activity.resource_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="text-center">
          <Button onClick={loadMore} disabled={loading} variant="outline">
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
