"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { teamService } from "@/lib/team-service";
import { dbService } from "@/lib/db-service";
import { invitationService } from "@/lib/invitation-service";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, Shield, Wrench, Activity, Settings as SettingsIcon,
  CreditCard, Link2, Key, FolderOpen, ArrowLeft
} from "lucide-react";

// Import all team components
import { TeamOverview } from "@/components/teams/team-overview";
import { MembersManagement } from "@/components/teams/members-management";
import { PermissionsMatrix } from "@/components/teams/permissions-matrix";
import { ToolsAccessControl } from "@/components/teams/tools-access-control";
import { ActivityFeed } from "@/components/teams/activity-feed";
import { TeamSettings } from "@/components/teams/team-settings";
import { BillingSubscription } from "@/components/teams/billing-subscription";
import { IntegrationsManager } from "@/components/teams/integrations-manager";
import { APIKeysManager } from "@/components/teams/api-keys-manager";

function TeamDashboardContent({ params }: { params: { teamId: string } }) {
  const router = useRouter();
  const { user, subscription } = useAuth();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [securitySettings, setSecuritySettings] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [teamAPIKeys, setTeamAPIKeys] = useState<any[]>([]);
  const [userAPIKeys, setUserAPIKeys] = useState<any[]>([]);
  const [toolAccess, setToolAccess] = useState<Record<string, Record<string, boolean>>>({});
  const [stats, setStats] = useState({
    activeMembers: 0,
    totalProjects: 0,
    recentActivityCount: 0,
    lastActivity: null as string | null,
  });

  // Dialogs
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [inviting, setInviting] = useState(false);
  const [creating, setCreating] = useState(false);

  // Computed
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isOwner = team?.owner_user_id === user?.id;
  const isAdmin = currentMember?.role === "admin" || isOwner;
  const canManage = isOwner || isAdmin;

  useEffect(() => {
    if (user) {
      loadTeamData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);

      // Load team details
      const teamData = await teamService.getTeamDetails(params.teamId);
      setTeam(teamData);

      // Load members
      const membersData = await teamService.getTeamMembers(params.teamId);
      setMembers(membersData);

      // Load projects
      const projectsData = await dbService.getTeamProjects(params.teamId);
      setProjects(projectsData);

      // Load activity
      const activityData = await teamService.getActivityFeed(params.teamId, { limit: 20 });
      setActivity(activityData);

      // Load security settings
      const securityData = await teamService.getSecuritySettings(params.teamId);
      setSecuritySettings(securityData);

      // Load integrations
      const integrationsData = await teamService.getTeamIntegrations(params.teamId);
      setIntegrations(integrationsData);

      // Load API keys
      const teamKeysData = await teamService.getTeamAPIKeys(params.teamId);
      setTeamAPIKeys(teamKeysData);

      if (user) {
        const userKeysData = await teamService.getUserAPIKeys(user.id, params.teamId);
        setUserAPIKeys(userKeysData);
      }

      // Calculate stats
      const activeMembers = membersData.filter((m) => m.joined_at && m.status === "active").length;
      const recentActivity = activityData.filter(
        (a) => new Date(a.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );
      const lastActivity = activityData.length > 0 ? activityData[0].created_at : null;

      setStats({
        activeMembers,
        totalProjects: projectsData.length,
        recentActivityCount: recentActivity.length,
        lastActivity,
      });
    } catch (error: any) {
      console.error("Failed to load team data:", error);

      let errorMessage = "Failed to load team data. Please refresh the page.";

      if (error.code === "42501") {
        errorMessage = "You don&apos;t have permission to view this team.";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Team not found. It may have been deleted.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }

      toast({
        title: "Error Loading Team",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!user || !inviteEmail.trim() || !team) return;

    try {
      setInviting(true);

      const memberCount = await dbService.getTeamMemberCount(params.teamId);
      const maxSeats = subscription?.seats || 30;

      if (memberCount >= maxSeats) {
        toast({
          title: "Seat Limit Reached",
          description: `Team has reached maximum capacity of ${maxSeats} members`,
          variant: "destructive",
        });
        return;
      }

      const existingMember = members.find(
        (m) =>
          m.profile?.email.toLowerCase() === inviteEmail.toLowerCase() ||
          m.invitation_email?.toLowerCase() === inviteEmail.toLowerCase()
      );

      if (existingMember) {
        toast({
          title: "Already Invited",
          description: "This email is already a team member or has a pending invitation",
          variant: "destructive",
        });
        return;
      }

      // Create invitation
      await dbService.inviteTeamMember({
        team_id: params.teamId,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user.id,
      });

      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      const token = await invitationService.createInvitation({
        teamId: params.teamId,
        teamName: team.name,
        email: inviteEmail,
        role: inviteRole,
        invitedBy: user.id,
        inviterName: inviterProfile?.full_name || inviterProfile?.email || user.email || "Team member",
      });

      await invitationService.sendInvitationEmail(
        {
          teamId: params.teamId,
          teamName: team.name,
          email: inviteEmail,
          role: inviteRole,
          invitedBy: user.id,
          inviterName: inviterProfile?.full_name || inviterProfile?.email || user.email || "Team member",
        },
        token
      );

      // Log activity
      await teamService.createActivity({
        team_id: params.teamId,
        user_id: user.id,
        action: "member_invited",
        resource_type: "team_member",
        metadata: { email: inviteEmail, role: inviteRole },
      });

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
      });

      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      await loadTeamData();
    } catch (error: any) {
      console.error("Failed to invite member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !projectName.trim()) return;

    try {
      setCreating(true);

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          team_id: params.teamId,
          name: projectName,
          description: projectDescription || null,
          status: "planning",
        })
        .select()
        .single();

      if (error) {
        console.error("Database error creating project:", error);
        throw error;
      }

      if (!project) {
        throw new Error("Failed to create project - no data returned");
      }

      try {
        await teamService.createActivity({
          team_id: params.teamId,
          project_id: project.id,
          user_id: user.id,
          action: "project_created",
          resource_type: "project",
          resource_id: project.id,
          metadata: { project_name: projectName },
        });
      } catch (activityError) {
        console.error("Failed to log activity (non-critical):", activityError);
      }

      toast({
        title: "Project Created",
        description: `Project "${projectName}" created successfully`,
      });

      setCreateProjectDialogOpen(false);
      setProjectName("");
      setProjectDescription("");
      await loadTeamData();
      router.push(`/teams/${params.teamId}/projects/${project.id}`);
    } catch (error: any) {
      console.error("Failed to create project:", error);

      let errorMessage = "Failed to create project";

      if (error.code === "42501") {
        errorMessage = "Permission denied. You must be a team member to create projects.";
      } else if (error.code === "23503") {
        errorMessage = "Invalid team reference. Please refresh and try again.";
      } else if (error.code === "23505") {
        errorMessage = "A project with this name already exists in this team.";
      } else if (error.message?.includes("JWT")) {
        errorMessage = "Authentication error. Please sign in again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error Creating Project",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-400">Team not found</p>
          <Button onClick={() => router.push("/teams")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.push("/teams")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          All Teams
        </Button>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 gap-2">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">
              <LayoutDashboard className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs lg:text-sm">
              <Users className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs lg:text-sm">
              <Shield className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs lg:text-sm">
              <Wrench className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs lg:text-sm">
              <FolderOpen className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs lg:text-sm">
              <Activity className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs lg:text-sm">
              <CreditCard className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs lg:text-sm">
              <Link2 className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="text-xs lg:text-sm">
              <Key className="w-4 h-4 mr-0 lg:mr-2" />
              <span className="hidden lg:inline">API Keys</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TeamOverview
              team={team}
              stats={stats}
              currentUserId={user?.id || ""}
              isOwner={isOwner}
              isAdmin={isAdmin}
              onInviteMember={() => setInviteDialogOpen(true)}
              onCreateProject={() => setCreateProjectDialogOpen(true)}
              onSettings={() => {
                const settingsTab = document.querySelector('[value="settings"]') as HTMLElement;
                settingsTab?.click();
              }}
            />
          </TabsContent>

          <TabsContent value="members">
            <MembersManagement
              teamId={params.teamId}
              members={members}
              currentUserId={user?.id || ""}
              canManage={canManage}
              subscription={subscription ? { seats: subscription.seats } : undefined}
              onUpdateRole={async (memberId, role) => {
                await teamService.updateMemberRole(memberId, role);
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "role_changed",
                  resource_type: "team_member",
                  resource_id: memberId,
                  metadata: { new_role: role },
                });
                await loadTeamData();
                toast({ title: "Role Updated", description: "Member role updated successfully" });
              }}
              onSuspendMember={async (memberId) => {
                await teamService.suspendMember(memberId);
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "member_suspended",
                  resource_type: "team_member",
                  resource_id: memberId,
                });
                await loadTeamData();
                toast({ title: "Member Suspended", description: "Member has been suspended" });
              }}
              onReactivateMember={async (memberId) => {
                await teamService.reactivateMember(memberId);
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "member_reactivated",
                  resource_type: "team_member",
                  resource_id: memberId,
                });
                await loadTeamData();
                toast({ title: "Member Reactivated", description: "Member has been reactivated" });
              }}
              onRemoveMember={async (memberId) => {
                await teamService.removeMember(memberId);
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "member_removed",
                  resource_type: "team_member",
                  resource_id: memberId,
                });
                await loadTeamData();
                toast({ title: "Member Removed", description: "Member removed from team" });
              }}
              onResendInvitation={async (memberId) => {
                const token = await teamService.resendInvitation(memberId);
                toast({ title: "Invitation Resent", description: "Invitation email sent again" });
              }}
              onEditPermissions={(memberId) => {
                setSelectedMemberId(memberId);
                setPermissionsDialogOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionsMatrix
              teamId={params.teamId}
              currentRole={currentMember?.role || "member"}
              onUpdatePermissions={async (memberId: string, permissions: Record<string, boolean>) => {
                await teamService.updateMemberPermissions(memberId, permissions);
                await loadTeamData();
                toast({ title: "Permissions Updated", description: "Member permissions updated successfully" });
              }}
            />
          </TabsContent>

          <TabsContent value="tools">
            <ToolsAccessControl
              teamId={params.teamId}
              members={members.filter((m) => m.user_id)}
              toolAccess={toolAccess}
              onToggleToolAccess={async (memberId: string, toolId: string, enabled: boolean) => {
                if (enabled) {
                  await teamService.grantToolAccess(params.teamId, memberId, toolId, user?.id || "");
                } else {
                  await teamService.revokeToolAccess(params.teamId, memberId, toolId);
                }
                await loadTeamData();
                toast({
                  title: enabled ? "Access Granted" : "Access Revoked",
                  description: `Tool access ${enabled ? "granted" : "revoked"} successfully`,
                });
              }}
              onBulkToggleTools={async (toolIds: string[], enabled: boolean) => {
                for (const toolId of toolIds) {
                  for (const member of members.filter((m) => m.user_id)) {
                    if (enabled) {
                      await teamService.grantToolAccess(params.teamId, member.id, toolId, user?.id || "");
                    } else {
                      await teamService.revokeToolAccess(params.teamId, member.id, toolId);
                    }
                  }
                }
                await loadTeamData();
                toast({
                  title: "Bulk Update Complete",
                  description: `${toolIds.length} tools ${enabled ? "enabled" : "disabled"} for all members`,
                });
              }}
            />
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold gradient-text">Team Projects</h2>
                <Button onClick={() => setCreateProjectDialogOpen(true)}>
                  Create Project
                </Button>
              </div>
              {/* Project list would go here - using existing implementation from disabled folder */}
              <p className="text-gray-400">Project management interface here</p>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <ActivityFeed
              teamId={params.teamId}
              initialActivities={activity}
              onExport={async (startDate, endDate) => {
                return await teamService.exportActivityFeed(params.teamId, startDate, endDate);
              }}
            />
          </TabsContent>

          <TabsContent value="billing">
            <BillingSubscription
              subscription={subscription || {
                id: "",
                tier: "pro",
                status: "trial",
                trial_start: new Date().toISOString(),
                trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                seats: 1,
                paypal_transaction_id: null,
                created_at: new Date().toISOString(),
              }}
              memberCount={stats.activeMembers}
              onUpgrade={() => router.push("/profile/subscription")}
              onDowngrade={() => router.push("/profile/subscription")}
              onManagePayment={() => router.push("/profile/subscription")}
            />
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsManager
              teamId={params.teamId}
              integrations={integrations}
              onConnect={async (type, name, config) => {
                await teamService.createIntegration(params.teamId, type, name, config, user?.id || "");
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "integration_connected",
                  resource_type: "integration",
                  metadata: { integration_name: name },
                });
                await loadTeamData();
                toast({ title: "Integration Connected", description: `${name} connected successfully` });
              }}
              onDisconnect={async (integrationId) => {
                await teamService.deleteIntegration(integrationId);
                await loadTeamData();
                toast({ title: "Integration Disconnected", description: "Integration removed" });
              }}
              onConfigure={async (integrationId, config) => {
                await teamService.updateIntegration(integrationId, { config });
                await loadTeamData();
                toast({ title: "Integration Updated", description: "Settings saved successfully" });
              }}
            />
          </TabsContent>

          <TabsContent value="api-keys">
            <APIKeysManager
              teamId={params.teamId}
              currentUserId={user?.id || ""}
              teamAPIKeys={teamAPIKeys}
              userAPIKeys={userAPIKeys}
              canManageTeamKeys={canManage}
              onCreateTeamKey={async (name, expiresInDays) => {
                const result = await teamService.createTeamAPIKey(params.teamId, name, user?.id || "", expiresInDays);
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "api_key_created",
                  resource_type: "api_key",
                  metadata: { key_name: name, key_type: "team" },
                });
                await loadTeamData();
                return result;
              }}
              onCreateUserKey={async (name, expiresInDays) => {
                const result = await teamService.createUserAPIKey(user?.id || "", name, params.teamId, expiresInDays);
                await teamService.createActivity({
                  team_id: params.teamId,
                  user_id: user?.id || "",
                  action: "api_key_created",
                  resource_type: "api_key",
                  metadata: { key_name: name, key_type: "user" },
                });
                await loadTeamData();
                return result;
              }}
              onRevokeTeamKey={async (keyId) => {
                await teamService.revokeTeamAPIKey(keyId, user?.id || "");
                await loadTeamData();
                toast({ title: "Key Revoked", description: "API key revoked successfully" });
              }}
              onRevokeUserKey={async (keyId) => {
                await teamService.revokeUserAPIKey(keyId);
                await loadTeamData();
                toast({ title: "Key Revoked", description: "API key revoked successfully" });
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Invite Member Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Role</label>
                <Select value={inviteRole} onValueChange={(value: "admin" | "member") => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member - Can view and use tools</SelectItem>
                    <SelectItem value="admin">Admin - Can manage members and settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Project Dialog */}
        <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Start planning your next live production</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Project Name</label>
                <Input
                  placeholder="e.g., Summer Concert Series"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Description (optional)</label>
                <Textarea
                  placeholder="Brief description of the project..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={creating || !projectName.trim()}>
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function TeamDashboard({ params }: { params: { teamId: string } }) {
  return (
    <ProtectedRoute>
      <TeamDashboardContent params={params} />
    </ProtectedRoute>
  );
}
