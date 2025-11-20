"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase-browser"

const supabase = createClient();
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Search, CheckCircle, XCircle } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  quantity: number;
  value: number | null;
  location: string | null;
  status: string;
  notes: string | null;
  team_id: string;
  project_id: string | null;
}

interface Team {
  id: string;
  name: string;
}

const CATEGORIES = ["audio", "lighting", "video", "rigging", "power", "cable", "misc"];
const STATUSES = ["available", "in_use", "maintenance", "retired"];

export default function InventoryTool() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    category: "lighting",
    manufacturer: "",
    model: "",
    serial_number: "",
    quantity: 1,
    value: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadInventory();
    }
  }, [selectedTeam]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: teamsData } = await supabase
        .from("teams")
        .select("id, name")
        .or(`owner_user_id.eq.${user.id},id.in.(select team_id from team_members where user_id=${user.id})`);

      setTeams(teamsData || []);
      if (teamsData && teamsData.length > 0 && !selectedTeam) {
        setSelectedTeam(teamsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (!selectedTeam) return;

    try {
      const { data } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("team_id", selectedTeam)
        .order("name");

      setItems(data || []);
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  };

  const handleCreateItem = async () => {
    if (!user || !selectedTeam || !formData.name.trim()) return;

    try {
      const { error } = await supabase.from("inventory_items").insert({
        team_id: selectedTeam,
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer || null,
        model: formData.model || null,
        serial_number: formData.serial_number || null,
        quantity: formData.quantity,
        value: formData.value ? parseFloat(formData.value) : null,
        location: formData.location || null,
        notes: formData.notes || null,
        status: "available",
      });

      if (error) {
        console.error("Failed to create inventory item:", error);
        throw error;
      }

      await loadInventory();
      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to create item:", error);

      let errorMessage = "Failed to create inventory item";

      if (error.code === "42501") {
        errorMessage = "Permission denied. You must be a team member to add items.";
      } else if (error.code === "23503") {
        errorMessage = "Invalid team reference. Please refresh and try again.";
      } else if (error.code === "23505") {
        errorMessage = "An item with this serial number already exists.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("inventory_items")
        .update({ status: newStatus })
        .eq("id", itemId);

      if (error) {
        console.error("Failed to update inventory status:", error);
        throw error;
      }

      await loadInventory();
    } catch (error: any) {
      console.error("Failed to update status:", error);

      let errorMessage = "Failed to update item status";

      if (error.code === "42501") {
        errorMessage = "Permission denied. You can't modify this item.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "lighting",
      manufacturer: "",
      model: "",
      serial_number: "",
      quantity: 1,
      value: "",
      location: "",
      notes: "",
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const stats = {
    total: items.length,
    available: items.filter((i) => i.status === "available").length,
    inUse: items.filter((i) => i.status === "in_use").length,
    maintenance: items.filter((i) => i.status === "maintenance").length,
  };

  const getCurrentState = () => ({ items, selectedTeam });
  const handleLoadPreset = (data: any) => {
    if (data.selectedTeam) setSelectedTeam(data.selectedTeam);
  };

  if (loading) {
    return (
      <ToolShell toolId="inventory-tool" toolName="Inventory Tool" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading inventory...</p>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell toolId="inventory-tool" toolName="Inventory Tool" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 flex-1">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)} disabled={!selectedTeam}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {selectedTeam && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-panel border-white/10">
                <CardContent className="p-4">
                  <div className="text-gray-400 text-sm mb-1">Total Items</div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-white/10">
                <CardContent className="p-4">
                  <div className="text-gray-400 text-sm mb-1">Available</div>
                  <p className="text-2xl font-bold text-green-400">{stats.available}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-white/10">
                <CardContent className="p-4">
                  <div className="text-gray-400 text-sm mb-1">In Use</div>
                  <p className="text-2xl font-bold text-yellow-400">{stats.inUse}</p>
                </CardContent>
              </Card>
              <Card className="glass-panel border-white/10">
                <CardContent className="p-4">
                  <div className="text-gray-400 text-sm mb-1">Maintenance</div>
                  <p className="text-2xl font-bold text-orange-400">{stats.maintenance}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
              >
                All
              </Button>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {CATEGORIES.map((category) => {
                const categoryItems = itemsByCategory[category];
                if (categoryItems.length === 0) return null;

                return (
                  <Card key={category} className="glass-panel border-white/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="capitalize">{category}</CardTitle>
                        <Badge variant="outline">{categoryItems.length} items</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white">{item.name}</h4>
                                {(item.manufacturer || item.model) && (
                                  <p className="text-sm text-gray-400">
                                    {item.manufacturer} {item.model}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={item.status === "available" ? "default" : "secondary"}
                                className="capitalize"
                              >
                                {item.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-sm text-gray-400">
                              <p>Quantity: {item.quantity}</p>
                              {item.location && <p>Location: {item.location}</p>}
                              {item.serial_number && <p>S/N: {item.serial_number}</p>}
                            </div>

                            <div className="flex gap-2 mt-3">
                              {item.status === "available" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(item.id, "in_use")}
                                >
                                  Check Out
                                </Button>
                              )}
                              {item.status === "in_use" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(item.id, "available")}
                                >
                                  Return
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <Card className="glass-panel border-white/10">
                <CardContent className="py-12 text-center">
                  <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {items.length === 0 ? "No Inventory Items" : "No Matching Items"}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {items.length === 0
                      ? "Add your first item to start tracking gear"
                      : "Try adjusting your filters or search"}
                  </p>
                  {items.length === 0 && (
                    <Button onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Item
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>Add new gear to your team inventory</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Item Name</label>
                <Input
                  placeholder="e.g., LED Par Light"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Category</label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Manufacturer</label>
                <Input
                  placeholder="e.g., Chauvet"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Model</label>
                <Input
                  placeholder="e.g., COLORado 1"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Serial Number</label>
                <Input
                  placeholder="Optional"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Value ($)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Location</label>
                <Input
                  placeholder="e.g., Storage Room A"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                <Textarea
                  placeholder="Additional information..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem} disabled={!formData.name.trim()}>
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ToolShell>
  );
}
