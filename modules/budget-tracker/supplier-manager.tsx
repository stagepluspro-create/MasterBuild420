"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Building2, Edit, Trash2, Star } from "lucide-react";

interface Supplier {
  id: string;
  team_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  notes: string | null;
  reliability_rating: number;
  created_at: string;
}

interface SupplierManagerProps {
  teamId: string | null;
  onSelectSupplier?: (supplierId: string) => void;
}

export function SupplierManager({ teamId, onSelectSupplier }: SupplierManagerProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    payment_terms: "Net 30",
    notes: "",
    reliability_rating: 3,
  });

  useEffect(() => {
    if (teamId) {
      loadSuppliers();
    }
  }, [teamId]);

  const loadSuppliers = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from("budget_suppliers")
        .select("*")
        .eq("team_id", teamId)
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!teamId || !formData.name.trim()) return;

    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from("budget_suppliers")
          .update({
            name: formData.name,
            contact_name: formData.contact_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            payment_terms: formData.payment_terms || null,
            notes: formData.notes || null,
            reliability_rating: formData.reliability_rating,
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("budget_suppliers")
          .insert({
            team_id: teamId,
            name: formData.name,
            contact_name: formData.contact_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            payment_terms: formData.payment_terms || null,
            notes: formData.notes || null,
            reliability_rating: formData.reliability_rating,
          });

        if (error) throw error;
      }

      await loadSuppliers();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save supplier:", error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_name: supplier.contact_name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      payment_terms: supplier.payment_terms || "Net 30",
      notes: supplier.notes || "",
      reliability_rating: supplier.reliability_rating,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm("Delete this supplier? Budget items will no longer reference them.")) return;

    try {
      const { error } = await supabase
        .from("budget_suppliers")
        .delete()
        .eq("id", supplierId);

      if (error) throw error;
      await loadSuppliers();
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      payment_terms: "Net 30",
      notes: "",
      reliability_rating: 3,
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center text-gray-400">Loading suppliers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Suppliers & Vendors
        </h3>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => (
          <Card key={supplier.id} className="glass-panel border-white/10 hover:border-cyan-500/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{supplier.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)} className="h-7 w-7 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.id)} className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {renderStars(supplier.reliability_rating)}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {supplier.contact_name && (
                <p className="text-gray-300">Contact: {supplier.contact_name}</p>
              )}
              {supplier.email && (
                <p className="text-gray-400 truncate">{supplier.email}</p>
              )}
              {supplier.phone && (
                <p className="text-gray-400">{supplier.phone}</p>
              )}
              {supplier.payment_terms && (
                <Badge variant="outline" className="text-xs">{supplier.payment_terms}</Badge>
              )}
              {onSelectSupplier && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => onSelectSupplier(supplier.id)}
                >
                  Select Supplier
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers.length === 0 && (
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Suppliers</h3>
            <p className="text-gray-400 mb-6">Add suppliers to track vendor relationships</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Supplier
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            <DialogDescription>Track vendor contact information and payment terms</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Supplier Name *</label>
              <Input
                placeholder="e.g., PRG, VER, Clearwing"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Contact Name</label>
                <Input
                  placeholder="Primary contact"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Payment Terms</label>
                <Select value={formData.payment_terms} onValueChange={(v) => setFormData({ ...formData, payment_terms: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email</label>
                <Input
                  type="email"
                  placeholder="contact@supplier.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Phone</label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Address</label>
              <Input
                placeholder="Business address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Reliability Rating</label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, reliability_rating: rating })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        rating <= formData.reliability_rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Notes</label>
              <Textarea
                placeholder="Additional vendor information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingSupplier ? "Update" : "Add"} Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
