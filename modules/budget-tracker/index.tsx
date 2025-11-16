"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, TrendingUp, AlertCircle, Download, Building2, History, BarChart3, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { BudgetCharts } from "./budget-charts";
import { SupplierManager } from "./supplier-manager";
import { SnapshotManager } from "./snapshot-manager";
import { exportToCSV, exportToJSON, exportToPDF } from "./budget-export";

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  planned_cost: number;
  actual_cost: number;
  vendor: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  due_date: string | null;
  payment_date: string | null;
  invoice_number: string | null;
  currency: string;
  tax_rate: number;
  supplier_id: string | null;
}

interface Project {
  id: string;
  name: string;
  budget_total: number | null;
  venue: string | null;
  start_date: string | null;
  end_date: string | null;
  default_currency: string;
  tax_rate_default: number;
}

const CATEGORIES = [
  "lighting",
  "audio",
  "video",
  "equipment",
  "labor",
  "crew",
  "venue",
  "catering",
  "transportation",
  "materials",
  "permits",
  "insurance",
  "power",
  "logistics",
  "misc",
];

const STATUSES = ["estimated", "quoted", "purchase_order", "invoiced", "paid", "overdue"];

const STATUS_LABELS: Record<string, string> = {
  estimated: "Estimated",
  quoted: "Quoted",
  purchase_order: "Purchase Order",
  invoiced: "Invoiced",
  paid: "Paid",
  overdue: "Overdue",
};

export default function BudgetTracker() {
  const { user } = useAuth();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    category: "equipment",
    item: "",
    quantity: 1,
    unit_cost: 0,
    planned_cost: 0,
    actual_cost: 0,
    vendor: "",
    notes: "",
    invoice_number: "",
    due_date: "",
    payment_date: "",
    currency: "USD",
    tax_rate: 0,
    supplier_id: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedProject) {
      loadBudgetItems();
    }
  }, [selectedProject]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name, budget_total, venue, start_date, end_date, default_currency, tax_rate_default")
        .or(`owner_user_id.eq.${user.id},team_id.in.(select team_id from team_members where user_id=${user.id})`)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);
      if (projectsData && projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgetItems = async () => {
    if (!selectedProject) return;

    try {
      const { data } = await supabase
        .from("budget_items")
        .select("*")
        .eq("project_id", selectedProject)
        .order("created_at", { ascending: false });

      setBudgetItems(data || []);
    } catch (error) {
      console.error("Failed to load budget items:", error);
    }
  };

  const handleCreateItem = async () => {
    if (!user || !selectedProject || !formData.item.trim()) return;

    try {
      const totalCost = formData.quantity * formData.unit_cost;
      const plannedCost = formData.planned_cost || totalCost;

      const itemData: any = {
        project_id: selectedProject,
        created_by: user.id,
        category: formData.category,
        item: formData.item,
        quantity: formData.quantity,
        unit_cost: formData.unit_cost,
        total_cost: totalCost,
        planned_cost: plannedCost,
        actual_cost: formData.actual_cost || 0,
        vendor: formData.vendor || null,
        notes: formData.notes || null,
        status: "estimated",
        invoice_number: formData.invoice_number || null,
        due_date: formData.due_date || null,
        payment_date: formData.payment_date || null,
        currency: formData.currency || "USD",
        tax_rate: formData.tax_rate || 0,
        supplier_id: formData.supplier_id || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("budget_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) {
          console.error("Failed to update budget item:", error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("budget_items")
          .insert(itemData);

        if (error) {
          console.error("Failed to create budget item:", error);
          throw error;
        }
      }

      await loadBudgetItems();
      setCreateDialogOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error: any) {
      console.error("Failed to save budget item:", error);

      let errorMessage = editingItem ? "Failed to update budget item" : "Failed to create budget item";

      if (error.code === "42501") {
        errorMessage = "Permission denied. You don't have access to this project.";
      } else if (error.code === "23503") {
        errorMessage = "Invalid project or supplier reference.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === "paid" && !budgetItems.find(i => i.id === itemId)?.payment_date) {
        updateData.payment_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from("budget_items")
        .update(updateData)
        .eq("id", itemId);

      if (error) {
        console.error("Failed to update status:", error);
        throw error;
      }

      await loadBudgetItems();
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

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this budget item?")) return;

    try {
      const { error } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Failed to delete item:", error);
        throw error;
      }

      await loadBudgetItems();
    } catch (error: any) {
      console.error("Failed to delete item:", error);

      let errorMessage = "Failed to delete budget item";

      if (error.code === "42501") {
        errorMessage = "Permission denied. You can't delete this item.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      item: item.item,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      planned_cost: item.planned_cost,
      actual_cost: item.actual_cost,
      vendor: item.vendor || "",
      notes: item.notes || "",
      invoice_number: item.invoice_number || "",
      due_date: item.due_date || "",
      payment_date: item.payment_date || "",
      currency: item.currency,
      tax_rate: item.tax_rate,
      supplier_id: item.supplier_id || "",
    });
    setCreateDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "equipment",
      item: "",
      quantity: 1,
      unit_cost: 0,
      planned_cost: 0,
      actual_cost: 0,
      vendor: "",
      notes: "",
      invoice_number: "",
      due_date: "",
      payment_date: "",
      currency: "USD",
      tax_rate: 0,
      supplier_id: "",
    });
  };

  const currentProject = projects.find((p) => p.id === selectedProject);
  const totalPlanned = budgetItems.reduce((sum, item) => sum + (item.planned_cost || item.total_cost), 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actual_cost, 0);
  const paidAmount = budgetItems
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.total_cost, 0);
  const approvedAmount = budgetItems
    .filter((item) => ["approved", "paid", "invoiced"].includes(item.status))
    .reduce((sum, item) => sum + item.total_cost, 0);

  const filteredItems = budgetItems.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const itemsByCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = filteredItems.filter((item) => item.category === cat);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const getCurrentState = () => ({
    budgetItems,
    selectedProject,
    items: budgetItems,
  });

  const handleLoadPreset = (data: any) => {
    if (data.selectedProject) setSelectedProject(data.selectedProject);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "invoiced": return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "purchase_order": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "quoted": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "overdue": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const currentTeamId = currentProject ? (projects.find(p => p.id === selectedProject)?.id || null) : null;

  if (loading) {
    return (
      <ToolShell toolId="budget-tracker" toolName="Budget Tracker" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading budget data...</p>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell toolId="budget-tracker" toolName="Budget Tracker" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => { resetForm(); setEditingItem(null); setCreateDialogOpen(true); }} disabled={!selectedProject}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {selectedProject && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-panel border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span>Project Budget</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      ${currentProject?.budget_total?.toLocaleString() || "0"}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Total Planned</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-400">
                      ${totalPlanned.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-white/10">
                  <CardContent className="p-4">
                    <div className="text-gray-400 text-sm mb-1">Total Actual</div>
                    <p className="text-2xl font-bold text-violet-400">
                      ${totalActual.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-panel border-white/10">
                  <CardContent className="p-4">
                    <div className="text-gray-400 text-sm mb-1">Paid</div>
                    <p className="text-2xl font-bold text-green-400">
                      ${paidAmount.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {currentProject?.budget_total && totalPlanned > currentProject.budget_total && (
                <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-400">Over Budget</p>
                    <p className="text-sm text-red-300">
                      Planned total exceeds project budget by ${(totalPlanned - currentProject.budget_total).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search items or vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 w-4 h-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUSES.map(status => (
                      <SelectItem key={status} value={status}>{STATUS_LABELS[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {CATEGORIES.map((category) => {
                  const items = itemsByCategory[category];
                  if (items.length === 0) return null;

                  const categoryPlanned = items.reduce((sum, item) => sum + (item.planned_cost || item.total_cost), 0);
                  const categoryActual = items.reduce((sum, item) => sum + item.actual_cost, 0);
                  const isExpanded = expandedCategories[category] !== false;

                  return (
                    <Card key={category} className="glass-panel border-white/10">
                      <CardHeader className="cursor-pointer" onClick={() => toggleCategory(category)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            <CardTitle className="capitalize">{category}</CardTitle>
                            <Badge variant="outline">{items.length} items</Badge>
                          </div>
                          <div className="flex gap-4 text-sm">
                            <span className="text-cyan-400">Planned: ${categoryPlanned.toLocaleString()}</span>
                            <span className="text-violet-400">Actual: ${categoryActual.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="font-semibold text-white">{item.item}</p>
                                  <p className="text-sm text-gray-400">
                                    {item.quantity} × ${item.unit_cost} = ${item.total_cost.toLocaleString()}
                                    {item.vendor && ` · ${item.vendor}`}
                                    {item.invoice_number && ` · Invoice #${item.invoice_number}`}
                                  </p>
                                  {item.due_date && (
                                    <p className="text-xs text-gray-500">Due: {new Date(item.due_date).toLocaleDateString()}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Select
                                    value={item.status}
                                    onValueChange={(v) => handleUpdateStatus(item.id, v)}
                                  >
                                    <SelectTrigger className={`w-40 ${getStatusColor(item.status)}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                          {STATUS_LABELS[status]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                    Edit
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)} className="text-red-400 hover:text-red-300">
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {budgetItems.length === 0 && (
                <Card className="glass-panel border-white/10">
                  <CardContent className="py-12 text-center">
                    <DollarSign className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Budget Items</h3>
                    <p className="text-gray-400 mb-6">Add your first budget item to start tracking</p>
                    <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Item
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          {selectedProject && budgetItems.length > 0 ? (
            <BudgetCharts budgetItems={budgetItems} categories={CATEGORIES} />
          ) : (
            <Card className="glass-panel border-white/10">
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data</h3>
                <p className="text-gray-400">Add budget items to view charts and insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierManager teamId={currentTeamId} />
        </TabsContent>

        <TabsContent value="snapshots">
          {selectedProject && user ? (
            <SnapshotManager
              projectId={selectedProject}
              userId={user.id}
              currentBudgetData={getCurrentState()}
              onRestore={(data) => {
                // TODO: Implement snapshot restore
              }}
            />
          ) : (
            <Card className="glass-panel border-white/10">
              <CardContent className="py-12 text-center">
                <History className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
                <p className="text-gray-400">Choose a project to manage budget snapshots</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Budget Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400">
                Export your budget data in various formats for sharing with clients, vendors, or archiving.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-6"
                  onClick={() => currentProject && exportToCSV(budgetItems, currentProject)}
                  disabled={!selectedProject || budgetItems.length === 0}
                >
                  <Download className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-semibold">Export CSV</p>
                    <p className="text-xs text-gray-400">Spreadsheet format</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-6"
                  onClick={() => currentProject && exportToJSON(budgetItems, currentProject)}
                  disabled={!selectedProject || budgetItems.length === 0}
                >
                  <Download className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-semibold">Export JSON</p>
                    <p className="text-xs text-gray-400">Data format with metadata</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col gap-2 py-6"
                  onClick={() => currentProject && exportToPDF(budgetItems, currentProject)}
                  disabled={!selectedProject || budgetItems.length === 0}
                >
                  <Download className="w-8 h-8" />
                  <div className="text-center">
                    <p className="font-semibold">Print PDF</p>
                    <p className="text-xs text-gray-400">Professional report</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Budget Item" : "Add Budget Item"}</DialogTitle>
            <DialogDescription>Track costs for your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Category *</label>
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
                <label className="text-sm text-gray-400 mb-2 block">Currency</label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD $</SelectItem>
                    <SelectItem value="EUR">EUR €</SelectItem>
                    <SelectItem value="GBP">GBP £</SelectItem>
                    <SelectItem value="ZAR">ZAR R</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Item Description *</label>
              <Input
                placeholder="e.g., LED Par Lights Rental"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
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
                <label className="text-sm text-gray-400 mb-2 block">Unit Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Total</label>
                <Input
                  type="number"
                  value={(formData.quantity * formData.unit_cost).toFixed(2)}
                  readOnly
                  className="bg-white/5"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Planned Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty to use total"
                  value={formData.planned_cost || ""}
                  onChange={(e) => setFormData({ ...formData, planned_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Actual Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.actual_cost || ""}
                  onChange={(e) => setFormData({ ...formData, actual_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Vendor</label>
                <Input
                  placeholder="Supplier or vendor name"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Invoice Number</label>
                <Input
                  placeholder="INV-12345"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Payment Date</label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Tax Rate (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Notes</label>
              <Textarea
                placeholder="Additional details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setEditingItem(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateItem} disabled={!formData.item.trim()}>
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolShell>
  );
}
