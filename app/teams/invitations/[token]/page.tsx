"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { invitationService } from "@/lib/invitation-service";
import { toast } from "sonner";
import { Users, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

interface PageProps {
  params: {
    token: string;
  };
}

export default function InvitationTokenPage({ params }: PageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Store token in sessionStorage to accept after login
      sessionStorage.setItem("pending_invitation_token", params.token);
      router.push(`/auth/signin?redirect=/teams/invitations/${params.token}`);
      return;
    }

    loadInvitation();
  }, [user, authLoading, params.token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invitationService.getInvitationByToken(params.token);
      setInvitation(data);
    } catch (err: any) {
      setError(err.message || "Failed to load invitation");
      toast.error(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;

    try {
      setAccepting(true);
      await invitationService.acceptInvitation(params.token, user.id);
      toast.success(`You've joined ${invitation.team.name}!`);
      
      // Clear any stored token
      sessionStorage.removeItem("pending_invitation_token");
      
      // Redirect to team dashboard
      router.push(`/teams/${invitation.team_id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      setAccepting(true);
      await invitationService.declineInvitation(params.token);
      toast.success("Invitation declined");
      
      // Clear any stored token
      sessionStorage.removeItem("pending_invitation_token");
      
      // Redirect to teams page
      router.push("/teams");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline invitation");
    } finally {
      setAccepting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-gray-400">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <CardTitle>Invalid Invitation</CardTitle>
                <CardDescription>{error}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/teams")}>
                Go to Teams
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="container max-w-2xl mx-auto py-12">
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <CardTitle>Team Invitation</CardTitle>
              <CardDescription>
                You've been invited to join a team
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Team Name</span>
              <span className="font-medium text-white">{invitation.team.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Your Role</span>
              <span className="font-medium text-white capitalize">{invitation.role}</span>
            </div>
            {invitation.invited_by_profile && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Invited By</span>
                <span className="font-medium text-white">
                  {invitation.invited_by_profile.full_name || invitation.invited_by_profile.email}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Invitation Expires</span>
              <span className="font-medium text-white">
                {new Date(invitation.invitation_expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={accepting}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
            <Button
              onClick={handleDecline}
              disabled={accepting}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            By accepting this invitation, you'll join the team and gain access to shared tools and resources.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
