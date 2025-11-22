import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryOperation(operation, retries - 1);
    }
    throw error;
  }
}

export interface CreateProfileData {
  id: string;
  email: string;
  full_name?: string;
}

export interface CreateSubscriptionData {
  user_id: string;
  tier?: "pro" | "team";
  seats?: number;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  settings?: {
    units?: string;
    theme?: string;
  };
}

export interface CreatePresetData {
  user_id: string;
  tool_id: string;
  name: string;
  payload: any;
  project_id?: string;
  shared_with_team?: boolean;
}

export interface CreateProjectData {
  owner_user_id: string;
  name: string;
  description?: string;
}

export interface CreateInterestRequestData {
  user_id: string;
  tool_id: string;
}

export interface CreateAuditLogData {
  user_id: string;
  action: string;
  tool_id?: string;
  meta?: any;
}

export const dbService = {
  async createProfile(data: CreateProfileData) {
    return retryOperation(async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return profile;
    });
  },

  async createSubscription(data: CreateSubscriptionData) {
    return retryOperation(async () => {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return subscription;
    });
  },

  async updateProfile(userId: string, data: UpdateProfileData) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return profile;
  },

  async updateSubscription(
    userId: string,
    data: {
      status?: "trial" | "active" | "expired" | "canceled";
      tier?: "pro" | "team";
      paypal_transaction_id?: string;
      paypal_subscription_id?: string;
      seats?: number;
    }
  ) {
    // Call the API route instead of directly updating Supabase
    // This ensures proper authentication and server-side validation
    const response = await fetch('/api/subscriptions/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update subscription');
    }

    const result = await response.json();
    return result.subscription;
  },

  async getPresetsByToolId(userId: string, toolId: string) {
    const { data, error } = await supabase
      .from("presets")
      .select("*")
      .eq("user_id", userId)
      .eq("tool_id", toolId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createPreset(data: CreatePresetData) {
    if (!data.user_id) {
      throw new Error("User ID is required to create a preset");
    }
    if (!data.tool_id) {
      throw new Error("Tool ID is required to create a preset");
    }
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Preset name is required");
    }
    if (!data.payload) {
      throw new Error("Preset data is required");
    }

    return retryOperation(async () => {
      const { data: preset, error } = await supabase
        .from("presets")
        .insert({
          user_id: data.user_id,
          tool_id: data.tool_id,
          name: data.name.trim(),
          payload: data.payload,
          project_id: data.project_id || null,
          shared_with_team: data.shared_with_team || false,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error creating preset:", error);
        throw error;
      }

      if (!preset) {
        throw new Error("Failed to create preset - no data returned from database");
      }

      return preset;
    });
  },

  async updatePreset(
    presetId: string,
    data: { name?: string; payload?: any }
  ) {
    const { data: preset, error } = await supabase
      .from("presets")
      .update(data)
      .eq("id", presetId)
      .select()
      .single();

    if (error) throw error;
    return preset;
  },

  async deletePreset(presetId: string) {
    const { error } = await supabase
      .from("presets")
      .delete()
      .eq("id", presetId);

    if (error) throw error;
  },

  async createProject(data: CreateProjectData) {
    const { data: project, error } = await supabase
      .from("projects")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return project;
  },

  async getProjects(userId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createInterestRequest(data: CreateInterestRequestData) {
    const { data: request, error } = await supabase
      .from("interest_requests")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return request;
  },

  async hasRequestedTool(userId: string, toolId: string) {
    const { data, error } = await supabase
      .from("interest_requests")
      .select("id")
      .eq("user_id", userId)
      .eq("tool_id", toolId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async createAuditLog(data: CreateAuditLogData) {
    const { error } = await supabase.from("audit_log").insert(data);

    if (error) throw error;
  },

  async getRecentTools(userId: string, limit: number = 5) {
    const { data, error} = await supabase
      .from("audit_log")
      .select("tool_id, created_at")
      .eq("user_id", userId)
      .eq("action", "tool_opened")
      .not("tool_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getTeamProjects(teamId: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createTask(data: any) {
    const { data: task, error } = await supabase
      .from("tasks")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return task;
  },

  async getProjectTasks(projectId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, email)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateTask(taskId: string, updates: any) {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getActivityFeed(teamId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from("activity_feed")
      .select("*, user:profiles(full_name, email), project:projects(name)")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async createActivity(data: any) {
    const { error } = await supabase
      .from("activity_feed")
      .insert(data);

    if (error) throw error;
  },

  async getTeamMembers(teamId: string) {
    const { data, error } = await supabase
      .from("team_members")
      .select("*, profile:profiles(id, email, full_name, avatar_url)")
      .eq("team_id", teamId)
      .order("joined_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTeamById(teamId: string) {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async inviteTeamMember(data: {
    team_id: string;
    email: string;
    role: "admin" | "member";
    invited_by: string;
  }) {
    // Validate input data
    if (!data.team_id) {
      throw new Error("Team ID is required");
    }
    if (!data.email || !data.email.includes("@")) {
      throw new Error("Valid email address is required");
    }
    if (!data.role || !["admin", "member"].includes(data.role)) {
      throw new Error("Valid role is required (admin or member)");
    }
    if (!data.invited_by) {
      throw new Error("Inviter user ID is required");
    }

    // Check if email is already invited or is a member
    const { data: existing } = await supabase
      .from("team_members")
      .select("id, user_id, invitation_email")
      .eq("team_id", data.team_id)
      .or(`user_id.eq.${data.invited_by},invitation_email.eq.${data.email}`)
      .maybeSingle();

    if (existing) {
      if (existing.user_id) {
        throw new Error("This user is already a team member");
      } else {
        throw new Error("An invitation has already been sent to this email");
      }
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const { data: member, error } = await supabase
      .from("team_members")
      .insert({
        team_id: data.team_id,
        user_id: null,
        invitation_email: data.email.toLowerCase().trim(),
        role: data.role,
        invited_by: data.invited_by,
        invited_at: new Date().toISOString(),
        invitation_token: invitationToken,
        invitation_expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error inviting team member:", error);
      throw error;
    }

    if (!member) {
      throw new Error("Failed to create team invitation");
    }

    return member;
  },

  async removeTeamMember(teamMemberId: string) {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", teamMemberId);

    if (error) throw error;
  },

  async updateTeamMemberRole(teamMemberId: string, role: "owner" | "admin" | "member") {
    const { data, error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("id", teamMemberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserSubscription(userId: string) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getTeamMemberCount(teamId: string) {
    const { count, error } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .not("joined_at", "is", null);

    if (error) throw error;
    return count || 0;
  },

  async sharePreset(presetId: string, userId: string) {
    const { data, error } = await supabase
      .from("presets")
      .update({
        shared_with_team: true,
        shared_by: userId,
        shared_at: new Date().toISOString(),
      })
      .eq("id", presetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unsharePreset(presetId: string) {
    const { data, error } = await supabase
      .from("presets")
      .update({
        shared_with_team: false,
        shared_by: null,
        shared_at: null,
      })
      .eq("id", presetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTeamPresets(teamId: string, toolId: string) {
    const { data, error } = await supabase
      .from("presets")
      .select("*, user:profiles(full_name, email), project:projects(team_id)")
      .eq("tool_id", toolId)
      .eq("shared_with_team", true)
      .eq("project.team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPresetWithPermissions(presetId: string, userId: string) {
    const { data, error } = await supabase
      .from("presets")
      .select("*, project:projects(team_id)")
      .eq("id", presetId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const canManage = data.user_id === userId;

    if (data.shared_with_team && data.project?.team_id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", data.project.team_id)
        .eq("user_id", userId)
        .not("joined_at", "is", null)
        .maybeSingle();

      const canManageAsAdmin =
        membership && (membership.role === "owner" || membership.role === "admin");

      return {
        ...data,
        canManage: canManage || canManageAsAdmin,
        canView: true,
      };
    }

    return {
      ...data,
      canManage,
      canView: canManage,
    };
  },

  async createSubscriptionChange(data: {
    user_id: string;
    from_tier: string | null;
    to_tier: string;
    reason: string;
    paypal_transaction_id?: string | null;
  }) {
    return retryOperation(async () => {
      const { data: change, error } = await supabase
        .from("subscription_changes")
        .insert({
          user_id: data.user_id,
          from_tier: data.from_tier,
          to_tier: data.to_tier,
          reason: data.reason,
          paypal_transaction_id: data.paypal_transaction_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating subscription change:", error);
        throw error;
      }
      return change;
    });
  },
};
