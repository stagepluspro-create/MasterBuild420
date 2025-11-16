"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ToolShell } from "@/components/tools/tool-shell";
import { PatchlistManager } from "./patchlist-manager";
import { ChannelGrid } from "./channel-grid";
import { SignalFlowDiagram } from "./signal-flow-diagram";
import { MonitorMixManager } from "./monitor-mix-manager";
import { ExportDialog } from "./export-dialog";
import { patchlistService, Patchlist, PatchlistChannel, PatchlistCategory } from "@/lib/patchlist-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, Download, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatchList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPatchlist, setCurrentPatchlist] = useState<Patchlist | null>(null);
  const [channels, setChannels] = useState<PatchlistChannel[]>([]);
  const [categories, setCategories] = useState<PatchlistCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("channels");

  useEffect(() => {
    if (currentPatchlist) {
      loadPatchlistData();
    }
  }, [currentPatchlist?.id]);

  const loadPatchlistData = async () => {
    if (!currentPatchlist) return;

    try {
      setLoading(true);
      const [channelsData, categoriesData] = await Promise.all([
        patchlistService.getChannels(currentPatchlist.id),
        patchlistService.getCategories(currentPatchlist.id),
      ]);

      setChannels(channelsData);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error("Failed to load patchlist data:", error);
      toast({
        title: "Error",
        description: "Failed to load patchlist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatchlistSelect = (patchlist: Patchlist) => {
    setCurrentPatchlist(patchlist);
  };

  const handleSave = async () => {
    if (!currentPatchlist || !user) return;

    try {
      await patchlistService.updatePatchlist(currentPatchlist.id, {
        ...currentPatchlist,
        version: currentPatchlist.version + 1,
      });

      await patchlistService.createVersion(
        currentPatchlist.id,
        user.id,
        "Manual save"
      );

      toast({
        title: "Success",
        description: "Patchlist saved successfully",
      });

      setCurrentPatchlist({
        ...currentPatchlist,
        version: currentPatchlist.version + 1,
      });
    } catch (error: any) {
      console.error("Failed to save:", error);
      toast({
        title: "Error",
        description: "Failed to save patchlist",
        variant: "destructive",
      });
    }
  };

  const getCurrentState = () => ({
    patchlist: currentPatchlist,
    channels,
    categories,
  });

  const handleLoadPreset = (data: any) => {
    if (data.patchlist) {
      setCurrentPatchlist(data.patchlist);
      setChannels(data.channels || []);
      setCategories(data.categories || []);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-4 pb-12">
        <div className="max-w-6xl mx-auto glass-panel p-8 text-center">
          <h1 className="text-3xl font-bold gradient-text mb-4">
            Patch List Generator
          </h1>
          <p className="text-gray-400 mb-6">
            Sign in to create and manage professional patchlists for audio, video, and lighting.
          </p>
          <Button onClick={() => (window.location.href = "/auth/signin")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPatchlist) {
    return (
      <ToolShell
        toolId="patch-list"
        toolName="Patch List Generator"
        getCurrentState={getCurrentState}
        onLoad={handleLoadPreset}
      >
        <PatchlistManager onSelect={handlePatchlistSelect} />
      </ToolShell>
    );
  }

  return (
    <ToolShell
      toolId="patch-list"
      toolName="Patch List Generator"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">{currentPatchlist.name}</h2>
            {currentPatchlist.show_name && (
              <p className="text-sm text-gray-400">
                {currentPatchlist.show_name}
                {currentPatchlist.venue && ` @ ${currentPatchlist.venue}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPatchlist(null)}>
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save v{currentPatchlist.version}
            </Button>
            <Button size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="signal-flow">Signal Flow</TabsTrigger>
            <TabsTrigger value="monitors">Monitor Mixes</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-4 mt-4">
            <ChannelGrid
              patchlistId={currentPatchlist.id}
              channels={channels}
              categories={categories}
              onChannelsChange={setChannels}
              onCategoriesChange={setCategories}
            />
          </TabsContent>

          <TabsContent value="signal-flow" className="space-y-4 mt-4">
            <SignalFlowDiagram
              patchlistId={currentPatchlist.id}
              channels={channels}
              categories={categories}
            />
          </TabsContent>

          <TabsContent value="monitors" className="space-y-4 mt-4">
            <MonitorMixManager
              patchlistId={currentPatchlist.id}
              channels={channels}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-semibold mb-4">Patchlist Settings</h3>
              <p className="text-sm text-gray-400">
                Settings and console configuration coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <ExportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          patchlist={currentPatchlist}
          channels={channels}
          categories={categories}
        />
      </div>
    </ToolShell>
  );
}
