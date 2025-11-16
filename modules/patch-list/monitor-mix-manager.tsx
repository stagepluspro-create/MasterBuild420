"use client";

import { useState, useEffect } from "react";
import { patchlistService, PatchlistChannel, MonitorMix } from "@/lib/patchlist-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MonitorMixManagerProps {
  patchlistId: string;
  channels: PatchlistChannel[];
}

export function MonitorMixManager({ patchlistId, channels }: MonitorMixManagerProps) {
  const { toast } = useToast();
  const [mixes, setMixes] = useState<MonitorMix[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newMixData, setNewMixData] = useState({
    mix_name: "",
    assigned_to: "",
    physical_location: "",
  });

  useEffect(() => {
    loadMixes();
  }, [patchlistId]);

  const loadMixes = async () => {
    try {
      setLoading(true);
      const data = await patchlistService.getMonitorMixes(patchlistId);
      setMixes(data);
    } catch (error: any) {
      console.error("Failed to load monitor mixes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMix = async () => {
    if (!newMixData.mix_name.trim()) return;

    try {
      const newMix = await patchlistService.createMonitorMix({
        patchlist_id: patchlistId,
        mix_name: newMixData.mix_name,
        mix_number: mixes.length + 1,
        assigned_to: newMixData.assigned_to || null,
        physical_location: newMixData.physical_location || null,
        channel_assignments: {},
        sort_order: mixes.length,
      });

      setMixes([...mixes, newMix]);
      setCreateDialogOpen(false);
      setNewMixData({
        mix_name: "",
        assigned_to: "",
        physical_location: "",
      });

      toast({
        title: "Success",
        description: "Monitor mix created",
      });
    } catch (error: any) {
      console.error("Failed to create mix:", error);
      toast({
        title: "Error",
        description: "Failed to create monitor mix",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMix = async (mixId: string) => {
    if (!confirm("Delete this monitor mix?")) return;

    try {
      await patchlistService.deleteMonitorMix(mixId);
      setMixes(mixes.filter((m) => m.id !== mixId));
      toast({
        title: "Success",
        description: "Monitor mix deleted",
      });
    } catch (error: any) {
      console.error("Failed to delete mix:", error);
      toast({
        title: "Error",
        description: "Failed to delete monitor mix",
        variant: "destructive",
      });
    }
  };

  const toggleChannelInMix = async (mixId: string, channelId: string) => {
    const mix = mixes.find((m) => m.id === mixId);
    if (!mix) return;

    try {
      const assignments = mix.channel_assignments || {};
      const isAssigned = assignments[channelId];

      const updatedAssignments = {
        ...assignments,
        [channelId]: !isAssigned,
      };

      const updatedMix = await patchlistService.updateMonitorMix(mixId, {
        channel_assignments: updatedAssignments,
      });

      setMixes(mixes.map((m) => (m.id === mixId ? updatedMix : m)));
    } catch (error: any) {
      console.error("Failed to update mix assignment:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-panel border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Monitor Mixes</h3>
            <p className="text-sm text-gray-400">
              Configure which channels go to each monitor send
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Mix
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading monitor mixes...</div>
      ) : mixes.length === 0 ? (
        <Card className="glass-panel border-white/10 p-12 text-center">
          <p className="text-gray-400 mb-4">No monitor mixes configured</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Mix
          </Button>
        </Card>
      ) : (
        <Card className="glass-panel border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-3 text-left sticky left-0 bg-black/40 backdrop-blur-sm z-10">
                  Channel
                </th>
                {mixes.map((mix) => (
                  <th key={mix.id} className="p-3 text-center min-w-[120px]">
                    <div className="space-y-1">
                      <div className="font-semibold">{mix.mix_name}</div>
                      {mix.assigned_to && (
                        <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                          <User className="h-3 w-3" />
                          {mix.assigned_to}
                        </div>
                      )}
                      {mix.physical_location && (
                        <div className="text-xs text-gray-500">
                          📍 {mix.physical_location}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mt-1"
                        onClick={() => handleDeleteMix(mix.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 sticky left-0 bg-black/40 backdrop-blur-sm z-10">
                    <div className="font-semibold">{channel.channel_number}</div>
                    <div className="text-xs text-gray-400">{channel.source_name}</div>
                  </td>
                  {mixes.map((mix) => {
                    const isAssigned = mix.channel_assignments?.[channel.id] || false;
                    return (
                      <td key={mix.id} className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleChannelInMix(mix.id, channel.id)}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Monitor Mix</DialogTitle>
            <DialogDescription>
              Add a new monitor send configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Mix Name *</Label>
              <Input
                placeholder="e.g., AUX 1, IEM 1, Drum Mix"
                value={newMixData.mix_name}
                onChange={(e) =>
                  setNewMixData({ ...newMixData, mix_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Input
                placeholder="e.g., Lead Vocalist, Drummer"
                value={newMixData.assigned_to}
                onChange={(e) =>
                  setNewMixData({ ...newMixData, assigned_to: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Physical Location</Label>
              <Input
                placeholder="e.g., Stage Left, Center Front"
                value={newMixData.physical_location}
                onChange={(e) =>
                  setNewMixData({ ...newMixData, physical_location: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMix}
              disabled={!newMixData.mix_name.trim()}
            >
              Create Mix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
