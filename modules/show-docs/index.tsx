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
import { Plus, FileText, Edit, Save, X } from "lucide-react";

interface Document {
  id: string;
  title: string;
  type: string;
  content: any;
  version: number;
  created_at: string;
  updated_at: string;
  project_id: string;
  project?: { name: string };
}

interface Project {
  id: string;
  name: string;
}

const DOC_TYPES = [
  { value: "cue_sheet", label: "Cue Sheet" },
  { value: "schedule", label: "Schedule" },
  { value: "script", label: "Script" },
  { value: "rundown", label: "Rundown" },
  { value: "contact_list", label: "Contact List" },
  { value: "notes", label: "Notes" },
];

export default function ShowDocs() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [editing, setEditing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    type: "notes",
    project_id: "",
    content: "",
  });

  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name")
        .or(`owner_user_id.eq.${user.id},team_id.in.(select team_id from team_members where user_id=${user.id})`);

      setProjects(projectsData || []);

      const projectIds = projectsData?.map((p) => p.id) || [];

      if (projectIds.length > 0) {
        const { data: docsData } = await supabase
          .from("documents")
          .select("*, project:projects(name)")
          .in("project_id", projectIds)
          .order("updated_at", { ascending: false });

        setDocuments(docsData || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    if (!user || !formData.title.trim() || !formData.project_id) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          project_id: formData.project_id,
          created_by: user.id,
          title: formData.title,
          type: formData.type,
          content: { text: formData.content },
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;

      await loadData();
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  const handleSaveDocument = async () => {
    if (!selectedDoc) return;

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          content: { text: editContent },
          version: selectedDoc.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedDoc.id);

      if (error) throw error;

      await loadData();
      setEditing(false);
    } catch (error) {
      console.error("Failed to save document:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: "notes",
      project_id: "",
      content: "",
    });
  };

  const openDocument = (doc: Document) => {
    setSelectedDoc(doc);
    setEditContent(doc.content?.text || "");
    setEditing(false);
  };

  const getCurrentState = () => ({ documents });
  const handleLoadPreset = (data: any) => {};

  if (loading) {
    return (
      <ToolShell toolId="show-docs" toolName="Show Documents" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading documents...</p>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell toolId="show-docs" toolName="Show Documents" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-gray-400 text-sm">
            Shared editable documents for your production team
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Documents</h3>
            {documents.length === 0 ? (
              <Card className="glass-panel border-white/10">
                <CardContent className="py-8 text-center">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No documents yet</p>
                </CardContent>
              </Card>
            ) : (
              documents.map((doc) => (
                <Card
                  key={doc.id}
                  className={`glass-panel border-white/10 cursor-pointer transition-colors ${
                    selectedDoc?.id === doc.id ? "border-cyan-500/50" : "hover:border-cyan-500/30"
                  }`}
                  onClick={() => openDocument(doc)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-1">{doc.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Badge variant="outline" className="capitalize">
                        {doc.type.replace("_", " ")}
                      </Badge>
                      <span>v{doc.version}</span>
                    </div>
                    {doc.project && (
                      <p className="text-xs text-cyan-400 mt-1">{doc.project.name}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="md:col-span-2">
            {selectedDoc ? (
              <Card className="glass-panel border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedDoc.title}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        Version {selectedDoc.version} · Last updated{" "}
                        {new Date(selectedDoc.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editing ? (
                        <>
                          <Button size="sm" onClick={handleSaveDocument}>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => setEditing(true)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                      placeholder="Document content..."
                    />
                  ) : (
                    <div className="whitespace-pre-wrap font-mono text-sm text-gray-300 min-h-[400px]">
                      {editContent || "Empty document"}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-panel border-white/10">
                <CardContent className="py-32 text-center">
                  <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Document Selected</h3>
                  <p className="text-gray-400">
                    Select a document from the list or create a new one
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>Add a shared document for your team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Title</label>
                <Input
                  placeholder="e.g., Lighting Cue Sheet"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Document Type</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Project</label>
                <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Initial Content (optional)</label>
                <Textarea
                  placeholder="Document content..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDocument} disabled={!formData.title.trim() || !formData.project_id}>
                Create Document
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ToolShell>
  );
}
