"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, LayoutGrid, User, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_profile?: { full_name: string | null; email: string } | null;
  due_date: string | null;
  created_at: string;
  project_id?: string;
}

interface Project {
  id: string;
  name: string;
}

const STATUSES = ["todo", "in_progress", "completed", "blocked"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

export default function TaskTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigned_to: "",
    due_date: "",
    project_id: "",
  });

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

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, email)")
        .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`)
        .order("created_at", { ascending: false });

      setTasks(tasksData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !formData.title.trim()) return;

    try {
      setCreating(true);
      const taskData: any = {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        status: "todo",
        created_by: user.id,
        assigned_to: formData.assigned_to || null,
        due_date: formData.due_date || null,
        project_id: formData.project_id || null,
      };

      await dbService.createTask(taskData);
      await loadData();

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      setCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      await dbService.updateTask(taskId, updates);
      await loadData();

      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      assigned_to: "",
      due_date: "",
      project_id: "",
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (selectedProject === "all") return true;
    if (selectedProject === "none") return !task.project_id;
    return task.project_id === selectedProject;
  });

  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredTasks.filter((task) => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const getCurrentState = () => ({ tasks, view, selectedProject });
  const handleLoadPreset = (data: any) => {
    if (data.view) setView(data.view);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-400 border-red-400";
      case "high": return "text-orange-400 border-orange-400";
      case "medium": return "text-yellow-400 border-yellow-400";
      case "low": return "text-green-400 border-green-400";
      default: return "text-gray-400 border-gray-400";
    }
  };

  if (loading) {
    return (
      <ToolShell toolId="task-tracker" toolName="Task Tracker" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
        <div className="text-center py-12">
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell toolId="task-tracker" toolName="Task Tracker" getCurrentState={getCurrentState} onLoad={handleLoadPreset}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Kanban
            </Button>
            <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
              <List className="mr-2 h-4 w-4" />
              List
            </Button>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {view === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map((status) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">{STATUS_LABELS[status]}</h3>
                  <Badge variant="outline">{tasksByStatus[status].length}</Badge>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {tasksByStatus[status].map((task) => (
                    <Card key={task.id} className="glass-panel border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-semibold text-white">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.assigned_to_profile && (
                            <Badge variant="secondary" className="text-xs">
                              <User className="mr-1 h-3 w-3" />
                              {task.assigned_to_profile.full_name || task.assigned_to_profile.email}
                            </Badge>
                          )}
                          {task.due_date && (
                            <Badge variant="secondary" className="text-xs">
                              <Calendar className="mr-1 h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          {status !== "completed" && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateTask(task.id, { status: status === "todo" ? "in_progress" : "completed" })}>
                              {status === "todo" ? "Start" : "Complete"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="glass-panel border-white/10">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white">{task.title}</h4>
                      <Badge variant="outline" className="capitalize">
                        {STATUS_LABELS[task.status]}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && <p className="text-sm text-gray-400">{task.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {task.status !== "completed" && (
                      <Button size="sm" onClick={() => handleUpdateTask(task.id, { status: "completed" })}>
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a task to track work</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Task Title</label>
                <Input
                  placeholder="e.g., Setup stage lighting"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Description</label>
                <Textarea
                  placeholder="Task details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Priority</label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Due Date</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              {projects.length > 0 && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Project (optional)</label>
                  <Select value={formData.project_id} onValueChange={(v) => setFormData({ ...formData, project_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!formData.title.trim() || creating}>
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ToolShell>
  );
}
