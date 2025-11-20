"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Settings } from "lucide-react";

function ProfileContent() {
  const { user, profile, subscription, isTrialActive, trialDaysRemaining, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      await dbService.updateProfile(user.id, {
        full_name: fullName,
      });

      await refreshProfile();
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    if (subscription.status === "active") {
      return <Badge className="bg-green-500">Active</Badge>;
    } else if (subscription.status === "trial") {
      return <Badge className="bg-cyan-500">Trial ({trialDaysRemaining}d remaining)</Badge>;
    } else if (subscription.status === "expired") {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="outline">{subscription.status}</Badge>;
  };

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Profile</h1>
            <p className="text-gray-400">Manage your account settings</p>
          </div>
          <Link href="/profile/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  Profile updated successfully!
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email</label>
                <Input value={profile?.email} disabled />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Tier</p>
                  <p className="text-lg font-bold capitalize">{subscription?.tier}</p>
                </div>
              </div>

              {isTrialActive && (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <p className="text-sm text-cyan-300">
                    Your trial ends on{" "}
                    {subscription?.trial_end
                      ? new Date(subscription.trial_end).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              )}

              <Link href="/#pricing">
                <Button variant="outline" className="w-full">
                  Upgrade Subscription
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Account Created</span>
                <span>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User ID</span>
                <span className="font-mono text-xs">{user?.id.slice(0, 8)}...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  return <ProfileContent />;
}

