"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, FolderOpen, FileDown, Trash2 } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  payload: any;
  created_at: string;
}

interface ToolShellProps {
  toolId: string;
  toolName: string;
  children: React.ReactNode;
  onSave?: (presetData: any) => void;
  onLoad?: (presetData: any) => void;
  getCurrentState: () => any;
}

export function ToolShell({
  toolId,
  toolName,
  children,
  getCurrentState,
  onLoad,
}: ToolShellProps) {
  const { user } = useAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPresets();
      logToolOpened();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, toolId]);

  const loadPresets = async () => {
    if (!user) return;
    try {
      const data = await dbService.getPresetsByToolId(user.id, toolId);
      setPresets(data);
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
  };

  const logToolOpened = async () => {
    if (!user) return;
    try {
      await dbService.createAuditLog({
        user_id: user.id,
        action: "tool_opened",
        tool_id: toolId,
      });
    } catch (error) {
      console.error("Failed to log tool opened:", error);
    }
  };

  const handleSavePreset = async () => {
    if (!user || !presetName.trim()) return;

    try {
      setSaving(true);
      const currentState = getCurrentState();

      await dbService.createPreset({
        user_id: user.id,
        tool_id: toolId,
        name: presetName,
        payload: currentState,
      });

      await dbService.createAuditLog({
        user_id: user.id,
        action: "preset_saved",
        tool_id: toolId,
        meta: { preset_name: presetName },
      });

      await loadPresets();
      setSaveDialogOpen(false);
      setPresetName("");
    } catch (error) {
      console.error("Failed to save preset:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    if (onLoad) {
      onLoad(preset.payload);

      if (user) {
        await dbService.createAuditLog({
          user_id: user.id,
          action: "preset_loaded",
          tool_id: toolId,
          meta: { preset_id: preset.id, preset_name: preset.name },
        });
      }
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!user) return;

    try {
      await dbService.deletePreset(presetId);
      await loadPresets();
    } catch (error) {
      console.error("Failed to delete preset:", error);
    }
  };

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">{toolName}</h1>
          </div>

          {user && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Presets ({presets.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Saved Presets</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {presets.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-400">
                      No saved presets
                    </div>
                  ) : (
                    presets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between px-2 py-2 hover:bg-white/5 rounded"
                      >
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="flex-1 text-left text-sm"
                        >
                          {preset.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreset(preset.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => setSaveDialogOpen(true)}>
                <Save className="mr-2 h-4 w-4" />
                Save Preset
              </Button>
            </div>
          )}
        </div>

        <div className="glass-panel p-8">{children}</div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Results are for reference only. Always verify with calibrated equipment.
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Give this preset a name so you can load it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={saving || !presetName.trim()}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
