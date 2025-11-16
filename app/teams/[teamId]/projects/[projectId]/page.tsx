"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, FileText, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to_profile: { full_name: string | null; email: string } | null;
  created_at: string;
}

function ProjectDetailContent({ params }: { params: { teamId: string; projectId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTaskDialog, setCreateTaskDialog] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.projectId]);

  const loadProjectData = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.projectId)
        .single();

      if (error) throw error;
      setProject(projectData);

      const tasksData = await dbService.getProjectTasks(params.projectId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !taskTitle.trim()) return;

    try {
      setCreating(true);

      await dbService.createTask({
        project_id: params.projectId,
        created_by: user.id,
        title: taskTitle,
        description: taskDescription || null,
        status: "todo",
        priority: "medium",
      });

      await loadProjectData();
      setCreateTaskDialog(false);
      setTaskTitle("");
      setTaskDescription("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await dbService.updateTask(taskId, {
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      });
      await loadProjectData();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href={`/teams/${params.teamId}`} className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Team
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">{project?.name}</h1>
              {project?.description && (
                <p className="text-gray-400">{project.description}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {project?.status}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">
              <CheckSquare className="mr-2 h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="docs">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Tasks</h2>
              <Button onClick={() => setCreateTaskDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </div>

            {tasks.length === 0 ? (
              <Card className="glass-panel border-white/10">
                <CardContent className="py-12 text-center">
                  <CheckSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first task to start organizing work
                  </p>
                  <Button onClick={() => setCreateTaskDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} className="glass-panel border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
                          )}
                          <div className="flex gap-2">
                            <Badge variant="outline" className="capitalize">
                              {task.status.replace("_", " ")}
                            </Badge>
                            <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>
                              {task.priority}
                            </Badge>
                            {task.assigned_to_profile && (
                              <Badge variant="secondary">
                                {task.assigned_to_profile.full_name || task.assigned_to_profile.email}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.status !== "completed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateTaskStatus(task.id, "completed")}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs">
            <Card className="glass-panel border-white/10">
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Documents</h3>
                <p className="text-gray-400">
                  Document management coming soon
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={createTaskDialog} onOpenChange={setCreateTaskDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a task for your team to complete
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Task Title</label>
                <Input
                  placeholder="e.g., Set up stage lighting"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Description (optional)
                </label>
                <Textarea
                  placeholder="Task details..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateTaskDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={creating || !taskTitle.trim()}>
                {creating ? "Creating..." : "Create Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function ProjectDetail({ params }: { params: { teamId: string; projectId: string } }) {
  return (
    <ProtectedRoute>
      <ProjectDetailContent params={params} />
    </ProtectedRoute>
  );
}
