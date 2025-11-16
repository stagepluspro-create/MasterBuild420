"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { invitationService } from "@/lib/invitation-service";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle2, XCircle, Clock, Shield } from "lucide-react";

interface PendingInvitation {
  id: string;
  team: {
    id: string;
    name: string;
  };
  invitation_email: string;
  role: "admin" | "member";
  invited_at: string;
  invitation_expires_at: string;
  invitation_token: string;
}

function InvitationsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      loadInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const data = await invitationService.getPendingInvitationsForUser(user.email);
      setInvitations(data);
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (token: string, teamId: string) => {
    if (!user) return;

    try {
      setProcessingId(token);
      await invitationService.acceptInvitation(token, user.id);
      router.push(`/teams/${teamId}`);
    } catch (error: any) {
      console.error("Failed to accept invitation:", error);
      alert(error.message || "Failed to accept invitation");
      setProcessingId(null);
    }
  };

  const handleDecline = async (token: string) => {
    try {
      setProcessingId(token);
      await invitationService.declineInvitation(token);
      await loadInvitations();
    } catch (error: any) {
      console.error("Failed to decline invitation:", error);
      alert(error.message || "Failed to decline invitation");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Team Invitations</h1>
          <p className="text-gray-400">
            View and respond to pending team invitations
          </p>
        </div>

        {invitations.length === 0 ? (
          <Card className="glass-panel border-white/10">
            <CardContent className="py-12 text-center">
              <Mail className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Pending Invitations
              </h3>
              <p className="text-gray-400 mb-6">
                You don&apos;t have any pending team invitations at the moment
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <Card
                key={invitation.id}
                className="glass-panel border-white/10 hover:border-cyan-500/30 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {invitation.team.name}
                        <Badge
                          variant="outline"
                          className={
                            invitation.role === "admin"
                              ? "border-violet-400/50 text-violet-400"
                              : ""
                          }
                        >
                          {invitation.role === "admin" && (
                            <Shield className="w-3 h-3 mr-1" />
                          )}
                          {invitation.role.charAt(0).toUpperCase() +
                            invitation.role.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Invited on{" "}
                        {new Date(invitation.invited_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires{" "}
                      {new Date(invitation.invitation_expires_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDecline(invitation.invitation_token)}
                      variant="outline"
                      className="flex-1"
                      disabled={processingId === invitation.invitation_token}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                    <Button
                      onClick={() =>
                        handleAccept(invitation.invitation_token, invitation.team.id)
                      }
                      className="flex-1"
                      disabled={processingId === invitation.invitation_token}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {processingId === invitation.invitation_token
                        ? "Accepting..."
                        : "Accept"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Invitations() {
  return (
    <ProtectedRoute>
      <InvitationsContent />
    </ProtectedRoute>
  );
}
