"use client";

import { useState } from "react";
import { patchlistService, PatchlistChannel, PatchlistCategory } from "@/lib/patchlist-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight, Palette, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChannelGridProps {
  patchlistId: string;
  channels: PatchlistChannel[];
  categories: PatchlistCategory[];
  onChannelsChange: (channels: PatchlistChannel[]) => void;
  onCategoriesChange: (categories: PatchlistCategory[]) => void;
}

const SIGNAL_TYPES = [
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "lighting", label: "Lighting" },
  { value: "data", label: "Data" },
];

const AUDIO_INPUT_TYPES = ["XLR", "DI Box", "SM57", "SM58", "Beta 52A", "D6", "SM81", "AKG C414", "Sennheiser e604"];
const VIDEO_INPUT_TYPES = ["SDI", "HDMI", "DisplayPort", "NDI", "Fiber"];
const LIGHTING_INPUT_TYPES = ["DMX", "Art-Net", "sACN", "RDM"];

export function ChannelGrid({
  patchlistId,
  channels,
  categories,
  onChannelsChange,
  onCategoriesChange,
}: ChannelGridProps) {
  const { toast } = useToast();
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ channelId: string; field: string } | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const handleAddChannel = async (category?: string) => {
    try {
      const lastChannel = channels[channels.length - 1];
      const nextNumber = lastChannel ? parseInt(lastChannel.channel_number.replace(/\D/g, "")) + 1 : 1;

      const newChannel = await patchlistService.createChannel({
        patchlist_id: patchlistId,
        channel_number: `CH${nextNumber}`,
        source_name: "",
        category: category || "Uncategorized",
        signal_type: "audio",
        sort_order: channels.length,
      });

      onChannelsChange([...channels, newChannel]);
    } catch (error: any) {
      console.error("Failed to add channel:", error);
      toast({
        title: "Error",
        description: "Failed to add channel",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChannel = async (channelId: string, field: string, value: any) => {
    try {
      const updatedChannel = await patchlistService.updateChannel(channelId, { [field]: value });
      onChannelsChange(channels.map((ch) => (ch.id === channelId ? updatedChannel : ch)));
    } catch (error: any) {
      console.error("Failed to update channel:", error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedChannels.size === 0) return;
    if (!confirm(`Delete ${selectedChannels.size} selected channel(s)?`)) return;

    try {
      await patchlistService.bulkDeleteChannels(Array.from(selectedChannels));
      onChannelsChange(channels.filter((ch) => !selectedChannels.has(ch.id)));
      setSelectedChannels(new Set());
      toast({
        title: "Success",
        description: `Deleted ${selectedChannels.size} channel(s)`,
      });
    } catch (error: any) {
      console.error("Failed to delete channels:", error);
      toast({
        title: "Error",
        description: "Failed to delete channels",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateSelected = async () => {
    if (selectedChannels.size === 0) return;

    try {
      const channelsToDuplicate = channels.filter((ch) => selectedChannels.has(ch.id));
      const newChannels = channelsToDuplicate.map((ch, index) => ({
        ...ch,
        id: undefined,
        channel_number: `${ch.channel_number} (Copy)`,
        sort_order: channels.length + index,
      }));

      const created = await patchlistService.bulkCreateChannels(newChannels as any);
      onChannelsChange([...channels, ...created]);
      setSelectedChannels(new Set());
      toast({
        title: "Success",
        description: `Duplicated ${channelsToDuplicate.length} channel(s)`,
      });
    } catch (error: any) {
      console.error("Failed to duplicate channels:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate channels",
        variant: "destructive",
      });
    }
  };

  const toggleCategory = (categoryName: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryName)) {
      newCollapsed.delete(categoryName);
    } else {
      newCollapsed.add(categoryName);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleAddCategory = async () => {
    const name = prompt("Enter category name:");
    if (!name) return;

    try {
      const newCategory = await patchlistService.createCategory({
        patchlist_id: patchlistId,
        name,
        color: "#00D9FF",
        sort_order: categories.length,
        is_collapsed: false,
      });

      onCategoriesChange([...categories, newCategory]);
      toast({
        title: "Success",
        description: "Category created",
      });
    } catch (error: any) {
      console.error("Failed to create category:", error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    }
  };

  const groupedChannels = categories.length > 0
    ? categories.reduce((acc, cat) => {
        acc[cat.name] = channels.filter((ch) => ch.category === cat.name);
        return acc;
      }, {} as { [key: string]: PatchlistChannel[] })
    : { Uncategorized: channels };

  const getInputTypeOptions = (signalType: string) => {
    switch (signalType) {
      case "audio":
        return AUDIO_INPUT_TYPES;
      case "video":
        return VIDEO_INPUT_TYPES;
      case "lighting":
        return LIGHTING_INPUT_TYPES;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      <Card className="glass-panel border-white/10 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleAddChannel()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
            <Button size="sm" variant="outline" onClick={handleAddCategory}>
              <Palette className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
          {selectedChannels.size > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedChannels.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={handleDuplicateSelected}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {Object.entries(groupedChannels).map(([categoryName, categoryChannels]) => {
          const category = categories.find((c) => c.name === categoryName);
          const isCollapsed = collapsedCategories.has(categoryName);

          return (
            <div key={categoryName}>
              <div
                className="flex items-center gap-2 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => toggleCategory(categoryName)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: category?.color || "#00D9FF" }}
                />
                <h3 className="font-semibold text-white">{categoryName}</h3>
                <Badge variant="outline" className="ml-auto">
                  {categoryChannels.length} channels
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChannel(categoryName);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {!isCollapsed && (
                <Card className="glass-panel border-white/10 mt-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="p-2 text-left w-8">
                            <input
                              type="checkbox"
                              checked={
                                categoryChannels.length > 0 &&
                                categoryChannels.every((ch) => selectedChannels.has(ch.id))
                              }
                              onChange={(e) => {
                                const newSelected = new Set(selectedChannels);
                                categoryChannels.forEach((ch) => {
                                  if (e.target.checked) {
                                    newSelected.add(ch.id);
                                  } else {
                                    newSelected.delete(ch.id);
                                  }
                                });
                                setSelectedChannels(newSelected);
                              }}
                              className="rounded"
                            />
                          </th>
                          <th className="p-2 text-left w-24">CH #</th>
                          <th className="p-2 text-left min-w-[150px]">Source</th>
                          <th className="p-2 text-left w-24">Type</th>
                          <th className="p-2 text-left w-32">Input</th>
                          <th className="p-2 text-left w-32">Location</th>
                          <th className="p-2 text-left w-24">Snake</th>
                          <th className="p-2 text-left w-32">Console</th>
                          <th className="p-2 text-left min-w-[200px]">Notes</th>
                          <th className="p-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryChannels.map((channel) => (
                          <tr key={channel.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedChannels.has(channel.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedChannels);
                                  if (e.target.checked) {
                                    newSelected.add(channel.id);
                                  } else {
                                    newSelected.delete(channel.id);
                                  }
                                  setSelectedChannels(newSelected);
                                }}
                                className="rounded"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={channel.channel_number}
                                onChange={(e) => handleUpdateChannel(channel.id, "channel_number", e.target.value)}
                                className="h-8 text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={channel.source_name}
                                onChange={(e) => handleUpdateChannel(channel.id, "source_name", e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Source name"
                              />
                            </td>
                            <td className="p-2">
                              <Select
                                value={channel.signal_type}
                                onValueChange={(value) => handleUpdateChannel(channel.id, "signal_type", value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SIGNAL_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Select
                                value={channel.input_type || ""}
                                onValueChange={(value) => handleUpdateChannel(channel.id, "input_type", value)}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {getInputTypeOptions(channel.signal_type).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-2">
                              <Input
                                value={channel.physical_location || ""}
                                onChange={(e) => handleUpdateChannel(channel.id, "physical_location", e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Location"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={channel.snake_input || ""}
                                onChange={(e) => handleUpdateChannel(channel.id, "snake_input", e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Snake #"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={channel.console_channel || ""}
                                onChange={(e) => handleUpdateChannel(channel.id, "console_channel", e.target.value)}
                                className="h-8 text-sm"
                                placeholder="CH #"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={channel.notes || ""}
                                onChange={(e) => handleUpdateChannel(channel.id, "notes", e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Notes..."
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={async () => {
                                  if (confirm("Delete this channel?")) {
                                    await patchlistService.deleteChannel(channel.id);
                                    onChannelsChange(channels.filter((ch) => ch.id !== channel.id));
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      {channels.length === 0 && (
        <Card className="glass-panel border-white/10 p-12 text-center">
          <p className="text-gray-400 mb-4">No channels yet</p>
          <Button onClick={() => handleAddChannel()}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Channel
          </Button>
        </Card>
      )}
    </div>
  );
}
