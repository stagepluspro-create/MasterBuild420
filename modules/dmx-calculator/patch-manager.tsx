"use client";

import { useState, useEffect } from "react";
import { dmxService, DMXPatch } from "@/lib/dmx-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatchManagerProps {
  userId: string;
  onSelect: (patch: DMXPatch) => void;
}

export function PatchManager({ userId, onSelect }: PatchManagerProps) {
  const [patches, setPatches] = useState<DMXPatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPatchName, setNewPatchName] = useState("");
  const [newShowName, setNewShowName] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadPatches();
  }, [userId]);

  const loadPatches = async () => {
    try {
      setLoading(true);
      const data = await dmxService.getPatches(userId);
      setPatches(data);
    } catch (error: any) {
      console.error("Failed to load patches:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load patches. Please try again.",
        variant: "destructive",
      });
      setPatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatch = async () => {
    if (!newPatchName.trim()) {
      toast({
        title: "Error",
        description: "Patch name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const patch = await dmxService.createPatch({
        user_id: userId,
        name: newPatchName,
        show_name: newShowName || undefined,
        venue: newVenue || undefined,
      });

      toast({
        title: "Success",
        description: "Patch created successfully",
      });

      setCreateDialogOpen(false);
      setNewPatchName("");
      setNewShowName("");
      setNewVenue("");
      onSelect(patch);
    } catch (error) {
      console.error("Failed to create patch:", error);
      toast({
        title: "Error",
        description: "Failed to create patch",
        variant: "destructive",
      });
    }
  };

  const handleDeletePatch = async (patchId: string, patchName: string) => {
    if (!confirm(`Delete patch "${patchName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await dmxService.deletePatch(patchId);
      toast({
        title: "Success",
        description: "Patch deleted successfully",
      });
      loadPatches();
    } catch (error) {
      console.error("Failed to delete patch:", error);
      toast({
        title: "Error",
        description: "Failed to delete patch",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">Loading patches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">DMX Patches</h2>
          <p className="text-sm text-gray-400 mt-1">
            Select a patch to edit or create a new one
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Patch
        </Button>
      </div>

      {patches.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-white mb-2">
            No patches yet
          </h3>
          <p className="text-gray-400 mb-6">
            Create your first DMX patch to get started
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Patch
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patches.map((patch) => (
            <Card
              key={patch.id}
              className="p-4 hover:border-cyan-500/50 transition-colors cursor-pointer group"
              onClick={() => onSelect(patch)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {patch.name}
                  </h3>
                  {patch.show_name && (
                    <p className="text-sm text-gray-400 truncate">
                      {patch.show_name}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePatch(patch.id, patch.name);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-1 text-xs text-gray-400">
                {patch.venue && <p>Venue: {patch.venue}</p>}
                <p>Universes: {patch.universe_count}</p>
                <p>Version: {patch.version}</p>
                <p className="text-[10px]">
                  Updated: {new Date(patch.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Patch</DialogTitle>
            <DialogDescription>
              Create a new DMX patch document for your lighting rig
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="patch-name">Patch Name *</Label>
              <Input
                id="patch-name"
                placeholder="e.g., Festival Main Stage 2024"
                value={newPatchName}
                onChange={(e) => setNewPatchName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="show-name">Show Name</Label>
              <Input
                id="show-name"
                placeholder="e.g., Summer Music Festival"
                value={newShowName}
                onChange={(e) => setNewShowName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                placeholder="e.g., Red Rocks Amphitheatre"
                value={newVenue}
                onChange={(e) => setNewVenue(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePatch} disabled={!newPatchName.trim()}>
              Create Patch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
