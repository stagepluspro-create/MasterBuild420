"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Save, FolderOpen, Users, Share2, MoreVertical, Trash2, Download } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  payload: any;
  created_at: string;
  shared_with_team: boolean;
  user?: {
    full_name: string | null;
    email: string;
  };
}

interface PresetManagerProps {
  toolId: string;
  currentData: any;
  onLoad: (data: any) => void;
  projectId?: string;
}

export function PresetManager({ toolId, currentData, onLoad, projectId }: PresetManagerProps) {
  const { user } = useAuth();
  const [myPresets, setMyPresets] = useState<Preset[]>([]);
  const [teamPresets, setTeamPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userTeams, setUserTeams] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadPresets();
      loadUserTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, toolId]);

  const loadUserTeams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("team_id, team:teams(id, name)")
        .eq("user_id", user.id)
        .not("joined_at", "is", null);

      if (error) throw error;
      setUserTeams(data?.map((tm: any) => tm.team) || []);
    } catch (error) {
      console.error("Failed to load teams:", error);
    }
  };

  const loadPresets = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const myData = await dbService.getPresetsByToolId(user.id, toolId);
      setMyPresets(myData);

      if (userTeams.length > 0) {
        const teamData = await Promise.all(
          userTeams.map((team) => dbService.getTeamPresets(team.id, toolId))
        );
        setTeamPresets(teamData.flat());
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !presetName.trim()) return;

    try {
      setSaving(true);

      // Validate preset name
      if (presetName.length < 3) {
        alert("Preset name must be at least 3 characters long");
        return;
      }

      if (presetName.length > 100) {
        alert("Preset name must be less than 100 characters");
        return;
      }

      // Create preset with proper error handling
      const preset = await dbService.createPreset({
        user_id: user.id,
        tool_id: toolId,
        name: presetName.trim(),
        payload: currentData,
        project_id: projectId,
        shared_with_team: shareWithTeam,
      });

      if (!preset) {
        throw new Error("Failed to create preset - no data returned");
      }

      await loadPresets();
      setSaveDialogOpen(false);
      setPresetName("");
      setShareWithTeam(false);

      // Preset saved successfully
    } catch (error: any) {
      console.error("Failed to save preset:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to save preset";

      if (error.message?.includes("duplicate")) {
        errorMessage = "A preset with this name already exists";
      } else if (error.message?.includes("permission")) {
        errorMessage = "You don&apos;t have permission to save presets";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error - please check your connection";
      } else if (error.code === "42501") {
        errorMessage = "Permission denied - please contact support";
      } else if (error.code === "23503") {
        errorMessage = "Invalid project or team reference";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLoad = (preset: Preset) => {
    onLoad(preset.payload);
  };

  const handleShare = async (presetId: string) => {
    if (!user) return;

    try {
      await dbService.sharePreset(presetId, user.id);
      await loadPresets();
    } catch (error: any) {
      console.error("Failed to share preset:", error);
      alert(error.message || "Failed to share preset");
    }
  };

  const handleUnshare = async (presetId: string) => {
    if (!user) return;

    try {
      await dbService.unsharePreset(presetId);
      await loadPresets();
    } catch (error: any) {
      console.error("Failed to unshare preset:", error);
      alert(error.message || "Failed to unshare preset");
    }
  };

  const handleDelete = async (presetId: string) => {
    try {
      await dbService.deletePreset(presetId);
      await loadPresets();
      setDeletingId(null);
    } catch (error: any) {
      console.error("Failed to delete preset:", error);
      alert(error.message || "Failed to delete preset");
    }
  };

  const handleExport = (preset: Preset) => {
    const dataStr = JSON.stringify(preset.payload, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${preset.name.replace(/\s+/g, "_")}_${toolId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Presets</CardTitle>
              <CardDescription>Save and load configurations</CardDescription>
            </div>
            <Button onClick={() => setSaveDialogOpen(true)} size="sm">
              <Save className="mr-2 h-4 w-4" />
              Save Preset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="my" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my">
                <FolderOpen className="mr-2 h-4 w-4" />
                My Presets ({myPresets.length})
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="mr-2 h-4 w-4" />
                Team Presets ({teamPresets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my" className="space-y-2 mt-4">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
              ) : myPresets.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No presets saved yet
                </p>
              ) : (
                myPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {preset.name}
                        </p>
                        {preset.shared_with_team && (
                          <Badge variant="outline" className="text-xs">
                            <Share2 className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(preset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoad(preset)}
                      >
                        Load
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport(preset)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                          {!preset.shared_with_team && userTeams.length > 0 && (
                            <DropdownMenuItem onClick={() => handleShare(preset.id)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Share with Team
                            </DropdownMenuItem>
                          )}
                          {preset.shared_with_team && (
                            <DropdownMenuItem onClick={() => handleUnshare(preset.id)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              Unshare
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeletingId(preset.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="team" className="space-y-2 mt-4">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
              ) : teamPresets.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No team presets available
                </p>
              ) : (
                teamPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {preset.name}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          Team
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        By {preset.user?.full_name || preset.user?.email || "Unknown"} •{" "}
                        {new Date(preset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoad(preset)}
                      >
                        Load
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport(preset)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Save your current configuration for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Preset Name</label>
              <Input
                placeholder="e.g., Concert Setup"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            {userTeams.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  id="share-team"
                  checked={shareWithTeam}
                  onChange={(e) => setShareWithTeam(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="share-team" className="text-sm text-gray-300 cursor-pointer">
                  Share with team (visible to all team members)
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !presetName.trim()}>
              {saving ? "Saving..." : "Save Preset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this preset? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
