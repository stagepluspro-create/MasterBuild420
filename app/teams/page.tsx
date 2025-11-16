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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
}

function TeamsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadTeams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error("Failed to load teams:", error);
      toast({
        title: "Error",
        description: "Failed to load teams. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;

    try {
      setCreating(true);

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          owner_user_id: user.id,
          name: teamName,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
        joined_at: new Date().toISOString(),
      });

      if (memberError) {
        await supabase.from("teams").delete().eq("id", team.id);
        throw memberError;
      }

      toast({
        title: "Success",
        description: "Team created successfully",
      });

      await loadTeams();
      setCreateDialogOpen(false);
      setTeamName("");
      router.push(`/teams/${team.id}`);
    } catch (error: any) {
      console.error("Failed to create team:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create team. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Teams</h1>
            <p className="text-gray-400">Collaborate with your crew on live productions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>

        {teams.length === 0 ? (
          <Card className="glass-panel border-white/10">
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Teams Yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first team to start collaborating on projects
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="glass-panel border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/teams/${team.id}`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{team.name}</span>
                    <ArrowRight className="w-5 h-5 text-cyan-400" />
                  </CardTitle>
                  <CardDescription>
                    {team.owner_user_id === user?.id ? "Owner" : "Member"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Start collaborating with your crew on live productions
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam} disabled={creating || !teamName.trim()}>
                {creating ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <ProtectedRoute>
      <TeamsContent />
    </ProtectedRoute>
  );
}
