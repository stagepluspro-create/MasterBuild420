"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, History, Download, Trash2 } from "lucide-react";

interface Snapshot {
  id: string;
  project_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  total_planned: number;
  total_actual: number;
  snapshot_data: any;
  created_at: string;
}

interface SnapshotManagerProps {
  projectId: string;
  userId: string;
  currentBudgetData: any;
  onRestore?: (snapshotData: any) => void;
}

export function SnapshotManager({ projectId, userId, currentBudgetData, onRestore }: SnapshotManagerProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadSnapshots();
  }, [projectId]);

  const loadSnapshots = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_snapshots")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSnapshots(data || []);
    } catch (error) {
      console.error("Failed to load snapshots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!formData.name.trim()) return;

    try {
      const totalPlanned = currentBudgetData.items?.reduce((sum: number, item: any) =>
        sum + (item.planned_cost || item.total_cost || 0), 0
      ) || 0;

      const totalActual = currentBudgetData.items?.reduce((sum: number, item: any) =>
        sum + (item.actual_cost || 0), 0
      ) || 0;

      const { error } = await supabase
        .from("budget_snapshots")
        .insert({
          project_id: projectId,
          created_by: userId,
          name: formData.name,
          description: formData.description || null,
          total_planned: totalPlanned,
          total_actual: totalActual,
          snapshot_data: currentBudgetData,
        });

      if (error) throw error;

      await loadSnapshots();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create snapshot:", error);
    }
  };

  const handleRestore = async (snapshot: Snapshot) => {
    if (!confirm(`Restore budget to "${snapshot.name}"? This will replace current data.`)) return;

    if (onRestore) {
      onRestore(snapshot.snapshot_data);
    }
  };

  const handleDelete = async (snapshotId: string) => {
    if (!confirm("Delete this snapshot? This cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("budget_snapshots")
        .delete()
        .eq("id", snapshotId);

      if (error) throw error;
      await loadSnapshots();
    } catch (error) {
      console.error("Failed to delete snapshot:", error);
    }
  };

  const handleExportSnapshot = (snapshot: Snapshot) => {
    const dataStr = JSON.stringify(snapshot, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-snapshot-${snapshot.name.replace(/\s+/g, "-")}-${new Date(snapshot.created_at).toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
  };

  const getVariance = (snapshot: Snapshot) => {
    const variance = snapshot.total_actual - snapshot.total_planned;
    return {
      value: Math.abs(variance),
      isOver: variance > 0,
    };
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading snapshots...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          Budget Snapshots
        </h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Camera className="mr-2 h-4 w-4" />
          Create Snapshot
        </Button>
      </div>

      <div className="space-y-3">
        {snapshots.map(snapshot => {
          const variance = getVariance(snapshot);
          return (
            <Card key={snapshot.id} className="glass-panel border-white/10">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-1">{snapshot.name}</CardTitle>
                    <p className="text-sm text-gray-400">
                      {new Date(snapshot.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleExportSnapshot(snapshot)} className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(snapshot.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.description && (
                  <p className="text-sm text-gray-300">{snapshot.description}</p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/5 rounded">
                    <p className="text-xs text-gray-400 mb-1">Planned</p>
                    <p className="text-lg font-semibold text-cyan-400">
                      ${snapshot.total_planned.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded">
                    <p className="text-xs text-gray-400 mb-1">Actual</p>
                    <p className="text-lg font-semibold text-violet-400">
                      ${snapshot.total_actual.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 rounded">
                    <p className="text-xs text-gray-400 mb-1">Variance</p>
                    <p className={`text-lg font-semibold ${variance.isOver ? 'text-red-400' : 'text-green-400'}`}>
                      ${variance.value.toLocaleString()}
                      {variance.isOver ? ' over' : ' under'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleRestore(snapshot)}
                >
                  Restore This Version
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {snapshots.length === 0 && (
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12 text-center">
            <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Snapshots</h3>
            <p className="text-gray-400 mb-6">Save budget versions at key milestones</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Camera className="mr-2 h-4 w-4" />
              Create First Snapshot
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Budget Snapshot</DialogTitle>
            <DialogDescription>
              Save the current budget state for future reference or restoration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Snapshot Name *</label>
              <Input
                placeholder="e.g., Initial, Revised, Client Approved, Final"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Description (optional)</label>
              <Textarea
                placeholder="Context for this version..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSnapshot} disabled={!formData.name.trim()}>
              Create Snapshot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
