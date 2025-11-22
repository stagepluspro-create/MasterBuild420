import { createClient } from "@/lib/supabase-browser";

// Create client inside functions to avoid SSR issues
const getSupabase = () => createClient();

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  invitation_email: string | null;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "suspended";
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  last_active: string | null;
  permissions: Record<string, boolean>;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface TeamRole {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamToolAccess {
  id: string;
  team_id: string;
  user_id: string | null;
  tool_id: string;
  enabled: boolean;
  granted_by: string | null;
  granted_at: string;
}

export interface TeamAPIKey {
  id: string;
  team_id: string;
  name: string;
  key_prefix: string;
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

export interface UserAPIKey {
  id: string;
  user_id: string;
  team_id: string | null;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

export interface TeamIntegration {
  id: string;
  team_id: string;
  integration_type: string;
  integration_name: string;
  config: Record<string, any>;
  status: "active" | "disconnected" | "error";
  last_sync_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamSecuritySettings {
  id: string;
  team_id: string;
  enforce_mfa: boolean;
  allowed_email_domains: string[];
  session_timeout_minutes: number;
  ip_whitelist: string[];
  require_password_change_days: number | null;
}

export interface ActivityFeedItem {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  project: {
    name: string;
  } | null;
}

// =====================================================
// TEAM OPERATIONS
// =====================================================

export const teamService = {
  // Get team details with member count
  async getTeamDetails(teamId: string) {
    const { data: team, error: teamError } = await getSupabase()
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle();

    if (teamError) throw teamError;
    if (!team) throw new Error("Team not found");

    const { count } = await getSupabase()
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .not("joined_at", "is", null)
      .eq("status", "active");

    return {
      ...team,
      member_count: count || 0,
    };
  },

  // Update team details
  async updateTeam(
    teamId: string,
    data: {
      name?: string;
      description?: string;
      logo_url?: string;
      contact_email?: string;
      settings?: Record<string, any>;
    }
  ) {
    const { data: team, error } = await getSupabase()
      .from("teams")
      .update(data)
      .eq("id", teamId)
      .select()
      .single();

    if (error) throw error;
    return team;
  },

  // Archive team
  async archiveTeam(teamId: string) {
    const { error } = await getSupabase()
      .from("teams")
      .update({ archived: true })
      .eq("id", teamId);

    if (error) throw error;
  },

  // Delete team
  async deleteTeam(teamId: string) {
    const { error } = await getSupabase().from("teams").delete().eq("id", teamId);

    if (error) throw error;
  },

  // Transfer team ownership
  async transferOwnership(teamId: string, newOwnerId: string) {
    const { error: teamError } = await getSupabase()
      .from("teams")
      .update({ owner_user_id: newOwnerId })
      .eq("id", teamId);

    if (teamError) throw teamError;

    // Update old owner to admin
    const { error: oldOwnerError } = await getSupabase()
      .from("team_members")
      .update({ role: "admin" })
      .eq("team_id", teamId)
      .eq("role", "owner")
      .neq("user_id", newOwnerId);

    if (oldOwnerError) throw oldOwnerError;

    // Update new owner role
    const { error: newOwnerError } = await getSupabase()
      .from("team_members")
      .update({ role: "owner" })
      .eq("team_id", teamId)
      .eq("user_id", newOwnerId);

    if (newOwnerError) throw newOwnerError;
  },

  // =====================================================
  // MEMBER OPERATIONS
  // =====================================================

  // Get all team members with pagination
  async getTeamMembers(teamId: string, options?: { limit?: number; offset?: number; search?: string }) {
    let query = getSupabase()
      .from("team_members")
      .select("*, profiles(id, email, full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: false });

    if (options?.search) {
      query = query.or(
        `profile.full_name.ilike.%${options.search}%,profile.email.ilike.%${options.search}%,invitation_email.ilike.%${options.search}%`
      );
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as TeamMember[];
  },

  // Get member by ID
  async getMember(memberId: string) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .select("*, profile:profiles!team_members_user_id_fkey(id, email, full_name, avatar_url)")
      .eq("id", memberId)
      .maybeSingle();

    if (error) throw error;
    return data as TeamMember | null;
  },

  // Update member role
  async updateMemberRole(memberId: string, role: "owner" | "admin" | "member" | "viewer") {
    const { data, error } = await getSupabase()
      .from("team_members")
      .update({ role })
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update member permissions
  async updateMemberPermissions(memberId: string, permissions: Record<string, boolean>) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .update({ permissions })
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Suspend member
  async suspendMember(memberId: string) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .update({ status: "suspended" })
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Reactivate member
  async reactivateMember(memberId: string) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .update({ status: "active" })
      .eq("id", memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove member
  async removeMember(memberId: string) {
    const { error } = await getSupabase().from("team_members").delete().eq("id", memberId);

    if (error) throw error;
  },

  // Resend invitation
  async resendInvitation(memberId: string) {
    const { data: member, error } = await getSupabase()
      .from("team_members")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();

    if (error) throw error;
    if (!member || !member.invitation_email) {
      throw new Error("Invalid invitation");
    }

    // Update invitation token and expiry
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await getSupabase()
      .from("team_members")
      .update({
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
      })
      .eq("id", memberId);

    if (updateError) throw updateError;

    return invitationToken;
  },

  // Get pending invitations
  async getPendingInvitations(teamId: string) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .is("user_id", null)
      .is("joined_at", null)
      .gt("invitation_expires_at", new Date().toISOString());

    if (error) throw error;
    return data;
  },

  // =====================================================
  // ROLES AND PERMISSIONS
  // =====================================================

  // Get team roles
  async getTeamRoles(teamId: string) {
    const { data, error } = await getSupabase()
      .from("team_roles")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as TeamRole[];
  },

  // Create custom role
  async createRole(teamId: string, name: string, description: string, permissions: Record<string, boolean>) {
    const { data, error } = await getSupabase()
      .from("team_roles")
      .insert({
        team_id: teamId,
        name,
        description,
        permissions,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update role
  async updateRole(roleId: string, data: { name?: string; description?: string; permissions?: Record<string, boolean> }) {
    const { data: role, error } = await getSupabase()
      .from("team_roles")
      .update(data)
      .eq("id", roleId)
      .select()
      .single();

    if (error) throw error;
    return role;
  },

  // Delete role
  async deleteRole(roleId: string) {
    const { error } = await getSupabase().from("team_roles").delete().eq("id", roleId).eq("is_system", false);

    if (error) throw error;
  },

  // Check user permission
  async hasPermission(teamId: string, userId: string, permission: string): Promise<boolean> {
    const { data, error } = await getSupabase().rpc("has_team_permission", {
      p_team_id: teamId,
      p_user_id: userId,
      p_permission: permission,
    });

    if (error) throw error;
    return data;
  },

  // =====================================================
  // TOOL ACCESS CONTROL
  // =====================================================

  // Get tool access for user
  async getUserToolAccess(teamId: string, userId: string) {
    const { data, error } = await getSupabase()
      .from("team_tool_access")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", userId);

    if (error) throw error;
    return data as TeamToolAccess[];
  },

  // Get all tool access for team
  async getTeamToolAccess(teamId: string) {
    const { data, error } = await getSupabase()
      .from("team_tool_access")
      .select("*, profile:profiles!team_tool_access_user_id_fkey(full_name, email)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Grant tool access to user
  async grantToolAccess(teamId: string, userId: string, toolId: string, grantedBy: string) {
    const { data, error } = await getSupabase()
      .from("team_tool_access")
      .upsert(
        {
          team_id: teamId,
          user_id: userId,
          tool_id: toolId,
          enabled: true,
          granted_by: grantedBy,
          granted_at: new Date().toISOString(),
        },
        {
          onConflict: "team_id,user_id,tool_id",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Revoke tool access from user
  async revokeToolAccess(teamId: string, userId: string, toolId: string) {
    const { data, error } = await getSupabase()
      .from("team_tool_access")
      .update({ enabled: false })
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .eq("tool_id", toolId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check if user can access tool
  async canAccessTool(teamId: string, userId: string, toolId: string): Promise<boolean> {
    const { data, error } = await getSupabase().rpc("can_access_tool", {
      p_team_id: teamId,
      p_user_id: userId,
      p_tool_id: toolId,
    });

    if (error) throw error;
    return data;
  },

  // =====================================================
  // API KEYS
  // =====================================================

  // Get team API keys
  async getTeamAPIKeys(teamId: string) {
    const { data, error } = await getSupabase()
      .from("team_api_keys")
      .select("id, team_id, name, key_prefix, created_by, last_used_at, expires_at, revoked, created_at")
      .eq("team_id", teamId)
      .eq("revoked", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TeamAPIKey[];
  },

  // Create team API key
  async createTeamAPIKey(teamId: string, name: string, createdBy: string, expiresInDays?: number) {
    const key = `stpteam_${crypto.randomUUID().replace(/-/g, "")}`;
    const keyPrefix = key.substring(0, 16);
    const keyHash = await hashString(key);

    let expiresAt = null;
    if (expiresInDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      expiresAt = expiryDate.toISOString();
    }

    const { data, error } = await getSupabase()
      .from("team_api_keys")
      .insert({
        team_id: teamId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        created_by: createdBy,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      key, // Only returned once
    };
  },

  // Revoke team API key
  async revokeTeamAPIKey(keyId: string, revokedBy: string) {
    const { error } = await getSupabase()
      .from("team_api_keys")
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      })
      .eq("id", keyId);

    if (error) throw error;
  },

  // Get user API keys
  async getUserAPIKeys(userId: string, teamId?: string) {
    let query = getSupabase()
      .from("user_api_keys")
      .select("id, user_id, team_id, name, key_prefix, last_used_at, expires_at, revoked, created_at")
      .eq("user_id", userId)
      .eq("revoked", false)
      .order("created_at", { ascending: false });

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as UserAPIKey[];
  },

  // Create user API key
  async createUserAPIKey(userId: string, name: string, teamId?: string, expiresInDays?: number) {
    const key = `stpuser_${crypto.randomUUID().replace(/-/g, "")}`;
    const keyPrefix = key.substring(0, 16);
    const keyHash = await hashString(key);

    let expiresAt = null;
    if (expiresInDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      expiresAt = expiryDate.toISOString();
    }

    const { data, error } = await getSupabase()
      .from("user_api_keys")
      .insert({
        user_id: userId,
        team_id: teamId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      key, // Only returned once
    };
  },

  // Revoke user API key
  async revokeUserAPIKey(keyId: string) {
    const { error } = await getSupabase()
      .from("user_api_keys")
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", keyId);

    if (error) throw error;
  },

  // =====================================================
  // INTEGRATIONS
  // =====================================================

  // Get team integrations
  async getTeamIntegrations(teamId: string) {
    const { data, error } = await getSupabase()
      .from("team_integrations")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as TeamIntegration[];
  },

  // Create integration
  async createIntegration(
    teamId: string,
    integrationType: string,
    integrationName: string,
    config: Record<string, any>,
    createdBy: string
  ) {
    const { data, error } = await getSupabase()
      .from("team_integrations")
      .insert({
        team_id: teamId,
        integration_type: integrationType,
        integration_name: integrationName,
        config,
        status: "active",
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update integration
  async updateIntegration(integrationId: string, data: { config?: Record<string, any>; status?: string }) {
    const { data: integration, error } = await getSupabase()
      .from("team_integrations")
      .update(data)
      .eq("id", integrationId)
      .select()
      .single();

    if (error) throw error;
    return integration;
  },

  // Delete integration
  async deleteIntegration(integrationId: string) {
    const { error } = await getSupabase().from("team_integrations").delete().eq("id", integrationId);

    if (error) throw error;
  },

  // =====================================================
  // SECURITY SETTINGS
  // =====================================================

  // Get security settings
  async getSecuritySettings(teamId: string) {
    const { data, error } = await getSupabase()
      .from("team_security_settings")
      .select("*")
      .eq("team_id", teamId)
      .maybeSingle();

    if (error) throw error;
    return data as TeamSecuritySettings | null;
  },

  // Update security settings
  async updateSecuritySettings(
    teamId: string,
    settings: {
      enforce_mfa?: boolean;
      allowed_email_domains?: string[];
      session_timeout_minutes?: number;
      ip_whitelist?: string[];
      require_password_change_days?: number;
    }
  ) {
    const { data, error } = await getSupabase()
      .from("team_security_settings")
      .upsert(
        {
          team_id: teamId,
          ...settings,
        },
        {
          onConflict: "team_id",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // =====================================================
  // ACTIVITY FEED
  // =====================================================

  // Get activity feed with pagination and filters
  async getActivityFeed(
    teamId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: string;
      userId?: string;
      resourceType?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    let query = getSupabase()
      .from("activity_feed")
      .select("*, user:profiles!activity_feed_user_id_fkey(full_name, email, avatar_url), project:projects(name)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (options?.action) {
      query = query.eq("action", options.action);
    }

    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }

    if (options?.resourceType) {
      query = query.eq("resource_type", options.resourceType);
    }

    if (options?.startDate) {
      query = query.gte("created_at", options.startDate);
    }

    if (options?.endDate) {
      query = query.lte("created_at", options.endDate);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as ActivityFeedItem[];
  },

  // Create activity log entry
  async createActivity(data: {
    team_id: string;
    user_id: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    project_id?: string;
    metadata?: Record<string, any>;
  }) {
    const { error } = await getSupabase().from("activity_feed").insert(data);

    if (error) throw error;
  },

  // Export activity feed to CSV
  async exportActivityFeed(teamId: string, startDate?: string, endDate?: string) {
    const activities = await this.getActivityFeed(teamId, {
      startDate,
      endDate,
      limit: 10000,
    });

    const csvRows = [
      ["Date", "User", "Action", "Resource Type", "Resource ID", "Project", "Details"],
      ...activities.map((a) => [
        new Date(a.created_at).toLocaleString(),
        a.user?.full_name || a.user?.email || "System",
        a.action,
        a.resource_type || "",
        a.resource_id || "",
        a.project?.name || "",
        JSON.stringify(a.metadata || {}),
      ]),
    ];

    return csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
  },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
