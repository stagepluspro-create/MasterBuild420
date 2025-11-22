import { createClient } from "@/lib/supabase-browser";
import emailjs from "@emailjs/browser";

// Create client inside functions to avoid SSR issues
const getSupabase = () => createClient();

export interface InvitationData {
  teamId: string;
  teamName: string;
  email: string;
  role: "admin" | "member";
  invitedBy: string;
  inviterName: string;
}

export const invitationService = {
  async sendInvitationEmail(data: InvitationData, token: string): Promise<void> {
    const invitationLink = `${window.location.origin}/teams/invitations/${token}`;

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
        process.env.NEXT_PUBLIC_EMAILJS_INVITATION_TEMPLATE_ID || "",
        {
          to_email: data.email,
          to_name: data.email.split("@")[0],
          from_name: data.inviterName,
          team_name: data.teamName,
          role: data.role,
          invitation_link: invitationLink,
          expires_days: "7",
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ""
      );
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      throw new Error("Failed to send invitation email");
    }
  },

  async getInvitationByToken(token: string) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .select("*, team:teams(id, name, owner_user_id)")
      .eq("invitation_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Invitation not found");

    if (
      data.invitation_expires_at &&
      new Date(data.invitation_expires_at) < new Date()
    ) {
      throw new Error("Invitation has expired");
    }

    if (data.joined_at) {
      throw new Error("Invitation has already been accepted");
    }

    return data;
  },

  async acceptInvitation(token: string, userId: string) {
    const invitation = await this.getInvitationByToken(token);

    const { error } = await getSupabase()
      .from("team_members")
      .update({
        user_id: userId,
        joined_at: new Date().toISOString(),
        invitation_token: null,
        invitation_expires_at: null,
      })
      .eq("invitation_token", token);

    if (error) throw error;

    return invitation;
  },

  async getPendingInvitationsForUser(email: string) {
    const { data, error } = await getSupabase()
      .from("team_members")
      .select("*, team:teams(id, name, owner_user_id)")
      .eq("invitation_email", email)
      .is("user_id", null)
      .is("joined_at", null)
      .gt("invitation_expires_at", new Date().toISOString());

    if (error) throw error;
    return data || [];
  },

  async declineInvitation(token: string) {
    const { error } = await getSupabase()
      .from("team_members")
      .delete()
      .eq("invitation_token", token);

    if (error) throw error;
  },
};
