"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Users,
  User,
  Crown,
  Zap,
  Shield,
  Calendar,
  TrendingUp,
  AlertCircle,
  Info,
  Sparkles,
} from "lucide-react";

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

  const {
    user,
    subscription,
    refreshSubscription,
    isTrialActive,
    isTrialExpired,
    trialDaysRemaining,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [creatingPro, setCreatingPro] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [changes, setChanges] = useState<SubscriptionChange[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // 🚀 SAFE FALLBACK VALUES
  const hasSubscription = !!subscription;
  const currentTier: "pro" | "team" | null = subscription?.tier ?? null;
  const isOnTrial = Boolean(isTrialActive);

  // 🔄 Load subscription changes
  useEffect(() => {
    loadSubscriptionChanges();
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

  const handleSubscribe = async (tier: 'pro' | 'team') => {
    const setLoadingState = tier === 'pro' ? setCreatingPro : setCreatingTeam;

    try {
      setLoadingState(true);

      const response = await fetch('/api/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const data = await response.json();

      // Redirect to PayPal for approval
      window.location.href = data.approveLink;
    } catch (error: any) {
      console.error('Failed to create subscription:', error);
      alert(error.message || 'Failed to start subscription process');
      setLoadingState(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !hasSubscription) return;

    try {
      setLoading(true);

      await dbService.updateSubscription(user.id, {
        status: "canceled",
      });

      await dbService.createAuditLog({
        user_id: user.id,
        action: "subscription_canceled",
        meta: { tier: currentTier },
      });

      await refreshSubscription();
      setCancelDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      alert(error.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  // 🏷 Status badge (now safe for null)
  const getStatusBadge = () => {
    if (!hasSubscription)
      return (
        <Badge variant="outline" className="opacity-60">
          No Subscription
        </Badge>
      );

    if (isTrialActive) {
      return (
        <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-0">
          <Clock className="w-3 h-3 mr-1" />
          Trial — {trialDaysRemaining} days left
        </Badge>
      );
    }

    switch (subscription?.status) {
      case "active":
        return (
          <Badge className="bg-green-500 border-0">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "canceled":
        return (
          <Badge
            variant="outline"
            className="border-red-400/50 text-red-400"
          >
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {subscription?.status}
          </Badge>
        );
    }
  };

  // ❗IMPORTANT: DO NOT RETURN A SPINNER FOR “no subscription”
  // Only return spinner if auth is still initializing, but subscription === null is NOT loading.

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold gradient-text mb-3">
                Your Subscription
              </h1>
              <p className="text-xl text-gray-400">
                Manage your Stage Tech Pro membership and billing
              </p>
            </div>

            {getStatusBadge()}
          </div>
        </div>

        {/* 🔥 TRIAL MESSAGES */}
        {hasSubscription && isTrialExpired && (
          <div className="mb-8 p-6 glass-panel border-yellow-500/40 bg-yellow-500/5 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="inline-flex p-3 rounded-lg bg-yellow-500/20">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">
                  Your Trial Has Ended
                </h3>
                <p className="text-gray-300 mb-4">
                  Subscribe now to continue accessing all 35+ professional tools.
                </p>
              </div>
            </div>
          </div>
        )}

        {hasSubscription && isOnTrial && (
          <div className="mb-8 p-6 glass-panel border-cyan-400/40 bg-cyan-500/5 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">
                  You're on a Free Trial
                </h3>
                <p className="text-gray-300 mb-1">
                  You have{" "}
                  <strong className="text-white">{trialDaysRemaining} days</strong>{" "}
                  remaining.
                </p>
                <p className="text-sm text-gray-400">
                  Ends on{" "}
                  {new Date(subscription?.trial_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 PLAN SELECTION — SAFE FOR NO SUBSCRIPTION */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">
              Choose Your Plan
            </h2>
            <p className="text-gray-400 text-lg">
              Select the perfect plan for your production needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* PRO PLAN */}
            <Card
              className={`glass-panel relative overflow-hidden transition-all ${
                currentTier === "pro"
                  ? "border-cyan-400/60 shadow-[0_0_30px_rgba(0,232,255,0.2)]"
                  : "border-white/10 hover:border-cyan-400/40"
              }`}
            >
              {currentTier === "pro" && (
                <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-bold rounded-bl-lg">
                  CURRENT PLAN
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 w-fit mb-4">
                  <User className="w-8 h-8 text-cyan-400" />
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  Pro
                </CardTitle>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold gradient-text">
                    $9.99
                  </span>
                  <span className="text-gray-400 text-lg">/month</span>
                </div>
                <CardDescription className="text-base text-gray-300">
                  Perfect for freelancers and technicians
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                
                {/* FEATURES */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    What's Included
                  </h4>

                  {[
                    "Access to all 35+ professional tools",
                    "Unlimited exports",
                    "Cloud sync",
                    "Offline access (PWA)",
                    "Regular updates",
                    "Email support",
                    "1 user license",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <span className="text-gray-300">{text}</span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/10" />

                {/* PRO — SUBSCRIBE OR MANAGE */}
                {currentTier === "pro" ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Info className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Active Subscription
                        </span>
                      </div>

                      <p className="text-sm text-gray-300">
                        You're on the Pro plan.
                      </p>
                    </div>

                    {subscription?.status !== "canceled" && (
                      <Button
                        variant="outline"
                        className="w-full border-red-400/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleSubscribe('pro')}
                      disabled={creatingPro}
                      className="w-full py-6 text-lg font-bold bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0"
                    >
                      {creatingPro ? 'Processing...' : 'Subscribe to Pro Plan'}
                    </Button>
                    <p className="text-center text-xs text-gray-400">
                      7-day free trial • Cancel anytime
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TEAM PLAN */}
            <Card
              className={`glass-panel relative overflow-hidden transition-all ${
                currentTier === "team"
                  ? "border-violet-400/60 shadow-[0_0_30px_rgba(155,92,255,0.2)]"
                  : "border-white/10 hover:border-violet-400/40"
              }`}
            >
              <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-violet-500 to-pink-500 text-xs text-white font-bold rounded-bl-lg">
                {currentTier === "team" ? "CURRENT PLAN" : "MOST POPULAR"}
              </div>

              <CardHeader className="pb-4">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 w-fit mb-4">
                  <Users className="w-8 h-8 text-violet-400" />
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  Team
                </CardTitle>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 text-transparent bg-clip-text">
                    $99.99
                  </span>
                  <span className="text-gray-400 text-lg">/month</span>
                </div>
                <CardDescription className="text-base text-gray-300">
                  Built for production companies and crews
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                    Everything in Pro, plus:
                  </h4>

                  {[
                    "Up to 30 team members",
                    "Shared project libraries",
                    "Team analytics",
                    "Advanced permissions",
                    "Priority support",
                    "Dedicated account manager",
                    "Custom team branding",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-violet-400 mt-0.5" />
                      <span className="text-gray-300">{text}</span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/10" />

                {/* TEAM — SUBSCRIBE OR MANAGE */}
                {currentTier === "team" ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-violet-500/10 border border-violet-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-violet-400 mb-2">
                        <Crown className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Active Team Plan
                        </span>
                      </div>

                      <p className="text-sm text-gray-300 mb-3">
                        You have access to all team features.
                      </p>

                      <Link href="/teams">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-violet-400/50"
                        >
                          Manage Team
                        </Button>
                      </Link>
                    </div>

                    {subscription?.status !== "canceled" && (
                      <Button
                        variant="outline"
                        className="w-full border-red-400/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleSubscribe('team')}
                      disabled={creatingTeam}
                      className="w-full py-6 text-lg font-bold bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                    >
                      {creatingTeam ? 'Processing...' : 'Subscribe to Team Plan'}
                    </Button>
                    <p className="text-center text-xs text-gray-400">
                      7-day free trial • Cancel anytime
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ─────────────────────── */}
        {/* LOWER INFO / HISTORY   */}
        {/* ─────────────────────── */}

        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <div className="inline-flex p-3 rounded-lg bg-cyan-500/10 w-fit mb-2">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <CardTitle className="text-lg">Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                All payments are processed securely through PayPal.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <div className="inline-flex p-3 rounded-lg bg-violet-500/10 w-fit mb-2">
                <Clock className="w-5 h-5 text-violet-400" />
              </div>
              <CardTitle className="text-lg">Cancel Anytime</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                No long-term contracts.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <div className="inline-flex p-3 rounded-lg bg-pink-500/10 w-fit mb-2">
                <Zap className="w-5 h-5 text-pink-400" />
              </div>
              <CardTitle className="text-lg">Instant Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">
                Start using all features immediately after subscribing.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SUBSCRIPTION DETAILS + HISTORY */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            {hasSubscription && (
              <Card className="glass-panel border-white/10">
                <CardHeader>
                  <CardTitle>Current Subscription Details</CardTitle>
                  <CardDescription>Overview of your active plan</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Plan Type</div>
                      <div className="text-lg font-bold text-white capitalize flex items-center gap-2">
                        {currentTier === "pro" ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                        {currentTier}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Status</div>
                      <div className="text-lg font-bold capitalize">
                        {getStatusBadge()}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Monthly Cost</div>
                      <div className="text-lg font-bold text-white">
                        {currentTier === "team" ? "$99.99" : "$9.99"}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">Team Seats</div>
                      <div className="text-lg font-bold text-white">
                        {currentTier === "team"
                          ? `Up to ${subscription?.seats ?? 30} users`
                          : "1 user"}
                      </div>
                    </div>
                  </div>

                  {isOnTrial && (
                    <div className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Free Trial Period
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-400">Started:</span>
                          <span className="text-white ml-2">
                            {new Date(subscription.trial_start).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-400">Ends:</span>
                          <span className="text-white ml-2">
                            {new Date(subscription.trial_end).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {subscription?.paypal_transaction_id && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          Payment Information
                        </span>
                      </div>

                      <div className="text-sm">
                        <span className="text-gray-400">Transaction ID:</span>
                        <code className="ml-2 text-xs text-cyan-400 font-mono">
                          {subscription.paypal_transaction_id.slice(0, 24)}...
                        </code>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {changes.length > 0 && (
              <Card className="glass-panel border-white/10">
                <CardHeader>
                  <CardTitle>Subscription History</CardTitle>
                  <CardDescription>
                    Recent changes to your subscription
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {changes.map((change) => (
                      <div
                        key={change.id}
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-white capitalize">
                              {change.reason}
                              {change.from_tier
                                ? `: ${change.from_tier} → ${change.to_tier}`
                                : `: ${change.to_tier}`}
                            </p>

                            <p className="text-xs text-gray-400">
                              {new Date(change.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {change.paypal_transaction_id && (
                          <Badge
                            variant="outline"
                            className="text-xs border-green-400/50 text-green-400"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
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

          {/* SUPPORT BOXES */}
          <div className="space-y-6">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription>
                  We're here to assist you
                </CardDescription>
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

                <Link href="/about">
                  <Button variant="outline" className="w-full">
                    About Stage Tech Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass-panel border-cyan-400/30 bg-cyan-500/5">
              <CardHeader>
                <div className="inline-flex p-3 rounded-lg bg-cyan-500/20 w-fit mb-2">
                  <Info className="w-5 h-5 text-cyan-400" />
                </div>
                <CardTitle className="text-lg">Billing Information</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-gray-300">
                <p>
                  <strong className="text-white">Billing Cycle:</strong>{" "}
                  Monthly, charged on the same day each month
                </p>
                <p>
                  <strong className="text-white">Payment Method:</strong>{" "}
                  PayPal (credit card, debit card, balance)
                </p>
                <p>
                  <strong className="text-white">Refund Policy:</strong> 30-day pro-rated refunds
                </p>

                <Separator className="bg-white/10" />

                <p className="text-xs text-gray-400">
                  All subscriptions renew automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CANCEL DIALOG */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="glass-panel border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to cancel your subscription?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 py-4">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                <span className="text-gray-300">
                  You will keep access until the end of your billing period.
                </span>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                <span className="text-gray-300">
                  Your data and presets will be preserved.
                </span>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <span className="text-gray-300">
                  You can reactivate anytime by subscribing again.
                </span>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>

              <AlertDialogAction
                onClick={handleCancelSubscription}
                className="bg-red-500 hover:bg-red-600"
                disabled={loading}
              >
                {loading ? "Canceling..." : "Yes, Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
