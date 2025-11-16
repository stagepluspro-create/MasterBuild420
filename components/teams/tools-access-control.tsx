"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Wrench, Users, TrendingUp, Lock, Unlock } from "lucide-react";
import { tools } from "@/lib/tools";

interface ToolAccessControlProps {
  teamId: string;
  members: Array<{
    id: string;
    user_id: string | null;
    profile: { full_name: string | null; email: string } | null;
  }>;
  toolAccess: Record<string, Record<string, boolean>>; // memberId -> toolId -> enabled
  onToggleToolAccess: (memberId: string, toolId: string, enabled: boolean) => Promise<void>;
  onBulkToggleTools: (toolIds: string[], enabled: boolean) => Promise<void>;
}

export function ToolsAccessControl({
  teamId,
  members,
  toolAccess,
  onToggleToolAccess,
  onBulkToggleTools,
}: ToolAccessControlProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(tools.filter((t) => t.status === "available").map((t) => t.category)));

  const filteredTools = tools.filter((tool) => {
    if (tool.status !== "available") return false;

    const matchesSearch =
      searchTerm === "" ||
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || tool.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getMemberToolAccess = (memberId: string, toolId: string): boolean => {
    return toolAccess[memberId]?.[toolId] ?? true; // Default to true if not explicitly set
  };

  const getToolAccessCount = (toolId: string): number => {
    return members.filter((m) => m.user_id && getMemberToolAccess(m.id, toolId)).length;
  };

  const toggleToolSelection = (toolId: string) => {
    setSelectedTools((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(toolId)) {
        newSet.delete(toolId);
      } else {
        newSet.add(toolId);
      }
      return newSet;
    });
  };

  const handleBulkAction = async (enabled: boolean) => {
    await onBulkToggleTools(Array.from(selectedTools), enabled);
    setSelectedTools(new Set());
    setBulkSelectMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and controls */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Tool Access Control
          </CardTitle>
          <CardDescription>
            Manage which tools team members can access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members
                    .filter((m) => m.user_id)
                    .map((member: typeof members[0]) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.profile?.full_name || member.profile?.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {bulkSelectMode && (
              <div className="flex items-center gap-2 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-300 flex-1">
                  {selectedTools.size} tool{selectedTools.size !== 1 ? "s" : ""} selected
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction(true)}
                  disabled={selectedTools.size === 0}
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Enable for All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction(false)}
                  disabled={selectedTools.size === 0}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Disable for All
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBulkSelectMode(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {!bulkSelectMode && (
              <Button variant="outline" onClick={() => setBulkSelectMode(true)} className="w-full">
                Bulk Manage Tools
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tools grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTools.map((tool: typeof tools[0]) => {
          const accessCount = getToolAccessCount(tool.id);
          const isSelected = selectedTools.has(tool.id);

          return (
            <Card
              key={tool.id}
              className={`glass-panel border-white/10 hover:border-white/20 transition-colors ${
                bulkSelectMode ? "cursor-pointer" : ""
              } ${isSelected ? "border-cyan-500/50 bg-cyan-500/5" : ""}`}
              onClick={() => bulkSelectMode && toggleToolSelection(tool.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {bulkSelectMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleToolSelection(tool.id)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {tool.name}
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {tool.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400">
                      {accessCount} of {members.filter((m) => m.user_id).length} members have access
                    </span>
                  </div>

                  {selectedMember !== "all" && !bulkSelectMode && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-sm text-white">
                        {members.find((m) => m.id === selectedMember)?.profile?.full_name ||
                          members.find((m) => m.id === selectedMember)?.profile?.email}
                      </span>
                      <Switch
                        checked={getMemberToolAccess(selectedMember, tool.id)}
                        onCheckedChange={(enabled) =>
                          onToggleToolAccess(selectedMember, tool.id, enabled)
                        }
                      />
                    </div>
                  )}

                  {selectedMember === "all" && !bulkSelectMode && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {members
                        .filter((m) => m.user_id)
                        .map((member: typeof members[0]) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 bg-white/5 rounded text-sm hover:bg-white/10 transition-colors"
                          >
                            <span className="text-gray-300 truncate">
                              {member.profile?.full_name || member.profile?.email}
                            </span>
                            <Switch
                              checked={getMemberToolAccess(member.id, tool.id)}
                              onCheckedChange={(enabled) =>
                                onToggleToolAccess(member.id, tool.id, enabled)
                              }
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No tools found matching your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Tool usage analytics */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Tool Usage Analytics
          </CardTitle>
          <CardDescription>Most accessed tools by your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTools
              .sort((a, b) => getToolAccessCount(b.id) - getToolAccessCount(a.id))
              .slice(0, 5)
              .map((tool: typeof tools[0]) => {
                const count = getToolAccessCount(tool.id);
                const percentage = Math.round(
                  (count / members.filter((m) => m.user_id).length) * 100
                );

                return (
                  <div key={tool.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white">{tool.name}</span>
                      <span className="text-gray-400">
                        {count} members ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-violet-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
