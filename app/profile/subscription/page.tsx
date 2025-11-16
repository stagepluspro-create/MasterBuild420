"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, CreditCard, Users, User, ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";

interface SubscriptionChange {
  id: string;
  from_tier: string | null;
  to_tier: string;
  reason: string;
  paypal_transaction_id: string | null;
  created_at: string;
}

function SubscriptionContent() {
  const router = useRouter();
  const { user, subscription, refreshSubscription, isTrialActive, isTrialExpired, trialDaysRemaining } = useAuth();
  const [loading, setLoading] = useState(false);
  const [changes, setChanges] = useState<SubscriptionChange[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);

  useEffect(() => {
    loadSubscriptionChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadSubscriptionChanges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("subscription_changes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setChanges(data || []);
    } catch (error) {
      console.error("Failed to load subscription changes:", error);
    }
  };

  const handleUpgrade = async () => {
    if (!user || !subscription) return;

    try {
      setLoading(true);

      await supabase
        .from("subscription_changes")
        .insert({
          user_id: user.id,
          from_tier: subscription.tier,
          to_tier: "team",
          reason: "upgrade",
        });

      await dbService.updateSubscription(user.id, {
        tier: "team",
        seats: 30,
      });

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          owner_user_id: user.id,
          name: `${user.email}'s Team`,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
        joined_at: new Date().toISOString(),
      });

      await dbService.createAuditLog({
        user_id: user.id,
        action: "subscription_upgraded",
        meta: { from: subscription.tier, to: "team", team_id: team.id },
      });

      await refreshSubscription();
      await loadSubscriptionChanges();
      setUpgradeDialogOpen(false);

      router.push(`/teams/${team.id}`);
    } catch (error: any) {
      console.error("Failed to upgrade:", error);
      alert(error.message || "Failed to upgrade subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    if (!user || !subscription) return;

    try {
      setLoading(true);

      await supabase
        .from("subscription_changes")
        .insert({
          user_id: user.id,
          from_tier: subscription.tier,
          to_tier: "pro",
          reason: "downgrade",
        });

      await dbService.updateSubscription(user.id, {
        tier: "pro",
        seats: 1,
      });

      await dbService.createAuditLog({
        user_id: user.id,
        action: "subscription_downgraded",
        meta: { from: subscription.tier, to: "pro" },
      });

      await refreshSubscription();
      await loadSubscriptionChanges();
      setDowngradeDialogOpen(false);

      alert("Subscription downgraded to Pro. Your team data will be retained but team features will be disabled.");
    } catch (error: any) {
      console.error("Failed to downgrade:", error);
      alert(error.message || "Failed to downgrade subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await dbService.updateSubscription(user.id, {
        status: "canceled",
      });

      await dbService.createAuditLog({
        user_id: user.id,
        action: "subscription_canceled",
        meta: { tier: subscription?.tier },
      });

      await refreshSubscription();
      setCancelDialogOpen(false);

      alert("Subscription canceled. You will retain access until the end of your billing period.");
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      alert(error.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    if (isTrialActive) {
      return (
        <Badge className="bg-cyan-500">
          <Clock className="w-3 h-3 mr-1" />
          Trial - {trialDaysRemaining} days left
        </Badge>
      );
    }

    switch (subscription.status) {
      case "active":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="outline">{subscription.status}</Badge>;
    }
  };

  const getTierIcon = (tier: string) => {
    return tier === "team" ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />;
  };

  if (!subscription) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400">Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/profile" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="text-4xl font-bold gradient-text mb-2">Subscription</h1>
          <p className="text-gray-400">Manage your Stage Tech Pro subscription</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                      {getTierIcon(subscription.tier)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl capitalize">{subscription.tier} Plan</CardTitle>
                      <CardDescription>
                        ${subscription.tier === "pro" ? "9.99" : "99.99"}/month
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge()}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Plan Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Status</span>
                      <span className="text-white capitalize">{subscription.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Seats</span>
                      <span className="text-white">{subscription.tier === "pro" ? "1" : `Up to ${subscription.seats || 30}`}</span>
                    </div>
                    {isTrialActive && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Trial Started</span>
                          <span className="text-white">
                            {new Date(subscription.trial_start).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Trial Ends</span>
                          <span className="text-white">
                            {new Date(subscription.trial_end).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                    {subscription.paypal_transaction_id && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Transaction ID</span>
                        <span className="text-white font-mono text-xs">
                          {subscription.paypal_transaction_id.slice(0, 16)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isTrialExpired && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2">Trial Expired</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Your trial has ended. Subscribe now to continue using all features.
                    </p>
                    <div className="flex gap-2">
                      {subscription.tier === "pro" ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: `
                            <style>.pp-BA5M2737P3VBE{text-align:center;border:none;border-radius:0.25rem;padding:0.5rem 1rem;height:2.25rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:0.875rem;cursor:pointer;}</style>
                            <form action="https://www.paypal.com/ncp/payment/BA5M2737P3VBE" method="post" target="_blank" style="display:inline;">
                              <input class="pp-BA5M2737P3VBE" type="submit" value="Subscribe to Pro" />
                            </form>
                          `,
                          }}
                        />
                      ) : (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: `
                            <style>.pp-FEC47P2HBV9K6{text-align:center;border:none;border-radius:0.25rem;padding:0.5rem 1rem;height:2.25rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:0.875rem;cursor:pointer;}</style>
                            <form action="https://www.paypal.com/ncp/payment/FEC47P2HBV9K6" method="post" target="_blank" style="display:inline;">
                              <input class="pp-FEC47P2HBV9K6" type="submit" value="Subscribe to Team" />
                            </form>
                          `,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Subscription Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {subscription.tier === "pro" && (
                      <Button onClick={() => setUpgradeDialogOpen(true)} variant="outline">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Upgrade to Team
                      </Button>
                    )}
                    {subscription.tier === "team" && (
                      <Button onClick={() => setDowngradeDialogOpen(true)} variant="outline">
                        <ArrowDownRight className="mr-2 h-4 w-4" />
                        Downgrade to Pro
                      </Button>
                    )}
                    {subscription.status !== "canceled" && (
                      <Button onClick={() => setCancelDialogOpen(true)} variant="outline" className="text-red-400 border-red-400/50 hover:bg-red-500/10">
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {changes.length > 0 && (
              <Card className="glass-panel border-white/10">
                <CardHeader>
                  <CardTitle>Subscription History</CardTitle>
                  <CardDescription>Recent changes to your subscription</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {changes.map((change) => (
                      <div
                        key={change.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white capitalize">
                              {change.reason}
                              {change.from_tier && `: ${change.from_tier} → ${change.to_tier}`}
                              {!change.from_tier && `: ${change.to_tier}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(change.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {change.paypal_transaction_id && (
                          <Badge variant="outline" className="text-xs">
                            <CreditCard className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {subscription.tier === "pro" && (
              <Card className="glass-panel border-cyan-400/40 shadow-[0_0_20px_rgba(0,232,255,0.15)]">
                <CardHeader>
                  <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 mb-3">
                    <Users className="w-6 h-6 text-cyan-400" />
                  </div>
                  <CardTitle>Upgrade to Team</CardTitle>
                  <CardDescription className="text-lg font-semibold text-white">
                    $99.99/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {[
                      "Up to 30 team members",
                      "Shared projects & presets",
                      "Team activity tracking",
                      "Member role management",
                      "Priority support & training",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => setUpgradeDialogOpen(true)} className="w-full">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/faq">
                  <Button variant="outline" className="w-full">
                    View FAQ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your subscription? You will retain access until the end of your billing period,
                but will lose access to all features after that.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                className="bg-red-500 hover:bg-red-600"
                disabled={loading}
              >
                {loading ? "Canceling..." : "Cancel Subscription"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upgrade to Team</DialogTitle>
              <DialogDescription>
                Unlock team collaboration features and invite up to 30 members
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <h4 className="text-sm font-semibold text-cyan-300 mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Your plan will be upgraded to Team ($99.99/month)</li>
                  <li>• A new team will be automatically created for you</li>
                  <li>• You can invite up to 30 team members</li>
                  <li>• All your existing projects and presets will be preserved</li>
                </ul>
              </div>
              <p className="text-sm text-gray-400">
                You will be redirected to PayPal to complete the payment. After successful payment,
                your team will be ready to use.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                Cancel
              </Button>
              <div
                dangerouslySetInnerHTML={{
                  __html: `
                  <style>.pp-upgrade-btn{text-align:center;border:none;border-radius:0.25rem;padding:0.5rem 1.5rem;height:2.5rem;font-weight:bold;background-color:#FFD140;color:#000000;font-family:"Helvetica Neue",Arial,sans-serif;font-size:0.875rem;cursor:pointer;}</style>
                  <form action="https://www.paypal.com/ncp/payment/FEC47P2HBV9K6" method="post" target="_blank" style="display:inline;">
                    <input class="pp-upgrade-btn" type="submit" value="Continue to PayPal" />
                  </form>
                `,
                }}
              />
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Downgrade to Pro</DialogTitle>
              <DialogDescription>
                Switch to individual plan and reduce costs
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Important Notice</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Your plan will change to Pro ($9.99/month)</li>
                  <li>• Team features will be disabled</li>
                  <li>• Your team data will be retained but inaccessible</li>
                  <li>• Team members will lose access to shared resources</li>
                  <li>• You can upgrade back to Team at any time</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDowngradeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDowngrade}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {loading ? "Processing..." : "Confirm Downgrade"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function Subscription() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  );
}
