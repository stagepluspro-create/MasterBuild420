"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { patchlistService, Patchlist } from "@/lib/patchlist-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatchlistManagerProps {
  onSelect: (patchlist: Patchlist) => void;
}

const TEMPLATES = [
  { id: "blank", name: "Blank Patchlist", category: "blank" },
  { id: "rock-band", name: "Rock Band (Audio)", category: "audio" },
  { id: "corporate-event", name: "Corporate Event (Audio/Video)", category: "mixed" },
  { id: "festival-main", name: "Festival Main Stage (Audio)", category: "audio" },
  { id: "theatre-production", name: "Theatre Production (Audio)", category: "audio" },
  { id: "lighting-rig", name: "Lighting Rig (DMX)", category: "lighting" },
  { id: "video-wall", name: "Video Wall (SDI)", category: "video" },
];

export function PatchlistManager({ onSelect }: PatchlistManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patchlists, setPatchlists] = useState<Patchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPatchlistData, setNewPatchlistData] = useState({
    name: "",
    show_name: "",
    venue: "",
    engineer_name: "",
    template: "blank",
  });

  useEffect(() => {
    loadPatchlists();
  }, [user]);

  const loadPatchlists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await patchlistService.getPatchlists(user.id);
      setPatchlists(data);
    } catch (error: any) {
      console.error("Failed to load patchlists:", error);
      toast({
        title: "Error",
        description: "Failed to load patchlists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newPatchlistData.name.trim()) return;

    try {
      setCreating(true);
      const patchlist = await patchlistService.createPatchlist({
        user_id: user.id,
        name: newPatchlistData.name,
        show_name: newPatchlistData.show_name || null,
        venue: newPatchlistData.venue || null,
        engineer_name: newPatchlistData.engineer_name || null,
        version: 1,
        is_template: false,
      });

      if (newPatchlistData.template !== "blank") {
        await createTemplateChannels(patchlist.id, newPatchlistData.template);
      }

      toast({
        title: "Success",
        description: "Patchlist created successfully",
      });

      setCreateDialogOpen(false);
      setNewPatchlistData({
        name: "",
        show_name: "",
        venue: "",
        engineer_name: "",
        template: "blank",
      });

      onSelect(patchlist);
    } catch (error: any) {
      console.error("Failed to create patchlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create patchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const createTemplateChannels = async (patchlistId: string, template: string) => {
    const templates: { [key: string]: any[] } = {
      "rock-band": [
        { category: "Vocals", channels: [
          { name: "Lead Vocal", type: "SM58" },
          { name: "BG Vocal 1", type: "SM58" },
          { name: "BG Vocal 2", type: "SM58" },
        ]},
        { category: "Drums", channels: [
          { name: "Kick In", type: "D6" },
          { name: "Kick Out", type: "Beta 91A" },
          { name: "Snare Top", type: "SM57" },
          { name: "Snare Bottom", type: "SM57" },
          { name: "Hi-Hat", type: "SM81" },
          { name: "Rack Tom 1", type: "Sennheiser e604" },
          { name: "Rack Tom 2", type: "Sennheiser e604" },
          { name: "Floor Tom", type: "Sennheiser e604" },
          { name: "OH Left", type: "AKG C414" },
          { name: "OH Right", type: "AKG C414" },
        ]},
        { category: "Guitars", channels: [
          { name: "Guitar Amp", type: "SM57" },
          { name: "Guitar DI", type: "DI Box" },
        ]},
        { category: "Bass", channels: [
          { name: "Bass Amp", type: "Beta 52A" },
          { name: "Bass DI", type: "DI Box" },
        ]},
        { category: "Keys", channels: [
          { name: "Keys L", type: "DI Box" },
          { name: "Keys R", type: "DI Box" },
        ]},
      ],
      "lighting-rig": [
        { category: "Front Truss", channels: [
          { name: "DMX 1.001-1.010", type: "Moving Heads" },
          { name: "DMX 1.011-1.020", type: "LED Pars" },
        ]},
        { category: "Mid Truss", channels: [
          { name: "DMX 1.021-1.030", type: "Moving Heads" },
        ]},
      ],
      "video-wall": [
        { category: "Video Inputs", channels: [
          { name: "Camera 1", type: "SDI" },
          { name: "Camera 2", type: "SDI" },
          { name: "Camera 3", type: "SDI" },
          { name: "Playback 1", type: "HDMI" },
        ]},
      ],
    };

    const templateData = templates[template];
    if (!templateData) return;

    let channelNumber = 1;
    const allChannels: any[] = [];

    for (const categoryData of templateData) {
      await patchlistService.createCategory({
        patchlist_id: patchlistId,
        name: categoryData.category,
        color: getCategoryColor(categoryData.category),
        sort_order: channelNumber,
        is_collapsed: false,
      });

      for (const channel of categoryData.channels) {
        allChannels.push({
          patchlist_id: patchlistId,
          channel_number: `CH${channelNumber}`,
          source_name: channel.name,
          category: categoryData.category,
          signal_type: template.includes("lighting") ? "lighting" : template.includes("video") ? "video" : "audio",
          input_type: channel.type,
          sort_order: channelNumber,
          color: getCategoryColor(categoryData.category),
        });
        channelNumber++;
      }
    }

    if (allChannels.length > 0) {
      await patchlistService.bulkCreateChannels(allChannels);
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      "Vocals": "#FF6B6B",
      "Drums": "#4ECDC4",
      "Guitars": "#FFE66D",
      "Bass": "#A8E6CF",
      "Keys": "#95E1D3",
      "Front Truss": "#F4D03F",
      "Mid Truss": "#F7DC6F",
      "Video Inputs": "#9B59B6",
    };
    return colors[category] || "#00D9FF";
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patchlist?")) return;

    try {
      await patchlistService.deletePatchlist(id);
      await loadPatchlists();
      toast({
        title: "Success",
        description: "Patchlist deleted successfully",
      });
    } catch (error: any) {
      console.error("Failed to delete:", error);
      toast({
        title: "Error",
        description: "Failed to delete patchlist",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (patchlist: Patchlist) => {
    if (!user) return;

    try {
      const channels = await patchlistService.getChannels(patchlist.id);
      const categories = await patchlistService.getCategories(patchlist.id);

      const newPatchlist = await patchlistService.createPatchlist({
        ...patchlist,
        id: undefined,
        user_id: user.id,
        name: `${patchlist.name} (Copy)`,
        version: 1,
        created_at: undefined,
        updated_at: undefined,
      });

      const categoryMap = new Map();
      for (const cat of categories) {
        const newCat = await patchlistService.createCategory({
          ...cat,
          id: undefined,
          patchlist_id: newPatchlist.id,
          created_at: undefined,
        });
        categoryMap.set(cat.id, newCat.id);
      }

      const newChannels = channels.map((ch) => ({
        ...ch,
        id: undefined,
        patchlist_id: newPatchlist.id,
        created_at: undefined,
        updated_at: undefined,
      }));

      if (newChannels.length > 0) {
        await patchlistService.bulkCreateChannels(newChannels);
      }

      toast({
        title: "Success",
        description: "Patchlist duplicated successfully",
      });

      await loadPatchlists();
    } catch (error: any) {
      console.error("Failed to duplicate:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate patchlist",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Patchlists</h2>
          <p className="text-sm text-gray-400">
            Manage your audio, video, and lighting routing documents
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Patchlist
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading patchlists...</p>
        </div>
      ) : patchlists.length === 0 ? (
        <Card className="glass-panel border-white/10">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold mb-2">No patchlists yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Create your first patchlist to start organizing your show routing
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Patchlist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patchlists.map((patchlist) => (
            <Card
              key={patchlist.id}
              className="glass-panel border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
              onClick={() => onSelect(patchlist)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{patchlist.name}</CardTitle>
                    {patchlist.show_name && (
                      <CardDescription className="truncate">
                        {patchlist.show_name}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDuplicate(patchlist)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(patchlist.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-gray-400">
                  {patchlist.venue && <p>Venue: {patchlist.venue}</p>}
                  {patchlist.engineer_name && <p>Engineer: {patchlist.engineer_name}</p>}
                  <p>Version: {patchlist.version}</p>
                  <p>Updated: {new Date(patchlist.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Patchlist</DialogTitle>
            <DialogDescription>
              Start from scratch or use a template to get started quickly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Patchlist Name *</Label>
              <Input
                placeholder="e.g., Summer Festival 2025"
                value={newPatchlistData.name}
                onChange={(e) =>
                  setNewPatchlistData({ ...newPatchlistData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Show Name</Label>
                <Input
                  placeholder="e.g., Rock Concert"
                  value={newPatchlistData.show_name}
                  onChange={(e) =>
                    setNewPatchlistData({ ...newPatchlistData, show_name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Venue</Label>
                <Input
                  placeholder="e.g., Madison Square Garden"
                  value={newPatchlistData.venue}
                  onChange={(e) =>
                    setNewPatchlistData({ ...newPatchlistData, venue: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Engineer Name</Label>
              <Input
                placeholder="Your name"
                value={newPatchlistData.engineer_name}
                onChange={(e) =>
                  setNewPatchlistData({ ...newPatchlistData, engineer_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Template</Label>
              <Select
                value={newPatchlistData.template}
                onValueChange={(value) =>
                  setNewPatchlistData({ ...newPatchlistData, template: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newPatchlistData.name.trim() || creating}>
              {creating ? "Creating..." : "Create Patchlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
