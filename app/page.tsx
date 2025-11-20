"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { createClient } from "@/lib/supabase-browser"

const supabase = createClient();
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function safeDateString(date?: string | null) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  } catch {
    return "—";
  }
}

function safeDateTimeString(date?: string | null) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  } catch {
    return "—";
  }
}

function SubscriptionContent() {
  const router = useRouter();
  // From your auth context (Option A: subscription row always exists)
  const { user, subscription, refreshSubscription, isTrialActive, isTrialExpired, trialDaysRemaining } = useAuth();

  // Local UI state
  const [loadingAction, setLoadingAction] = useState(false);
  const [changes, setChanges] = useState<SubscriptionChange[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Load subscription changes (history)
  useEffect(() => {
    let mounted = true;

    const loadSubscriptionChanges = async () => {
      if (!user) {
        if (mounted) setChanges([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subscription_changes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Failed to load subscription changes:", error);
          if (mounted) setChanges([]);
          return;
        }

        if (mounted) setChanges((data as SubscriptionChange[]) || []);
      } catch (err) {
        console.error("Failed to load subscription changes:", err);
        if (mounted) setChanges([]);
      }
    };

    loadSubscriptionChanges();

    return () => {
      mounted = false;
    };
    // Only run when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;

    try {
      setLoadingAction(true);

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
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      alert(error?.message || "Failed to cancel subscription");
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) {
      return <Badge variant="outline">No subscription</Badge>;
    }

    if (isTrialActive) {
      return (
        <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-0">
          <Clock className="w-3 h-3 mr-1" />
          Trial - {typeof trialDaysRemaining === "number" ? `${trialDaysRemaining} days left` : "Trial"}
        </Badge>
      );
    }

    switch (subscription.status) {
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
        return <Badge variant="outline" className="border-red-400/50 text-red-400">Canceled</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{subscription.status}</Badge>;
    }
  };

  // If, despite Option A, subscription is temporarily undefined, show friendly fallback (not infinite loader)
  if (!subscription) {
    return (
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block relative">
            <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
          </div>
          <p className="text-gray-400 mt-4">Fetching subscription details…</p>
        </div>
      </div>
    );
  }

  const currentTier = subscription.tier;
  const isOnTrial = Boolean(isTrialActive);

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/profile" className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold gradient-text mb-3">Your Subscription</h1>
              <p className="text-xl text-gray-400">Manage your Stage Tech Pro membership and billing</p>
            </div>
            <div>{getStatusBadge()}</div>
          </div>
        </div>

        {isTrialExpired && (
          <div className="mb-8 p-6 glass-panel border-yellow-500/40 bg-yellow-500/5 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="inline-flex p-3 rounded-lg bg-yellow-500/20">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400 mb-2">Your Trial Has Ended</h3>
                <p className="text-gray-300 mb-4">
                  Subscribe now to continue accessing all 35+ professional tools, cloud sync, team collaboration, and more.
                </p>
                <p className="text-sm text-gray-400">
                  Choose a plan below to unlock unlimited access to Stage Tech Pro.
                </p>
              </div>
            </div>
          </div>
        )}

        {isOnTrial && (
          <div className="mb-8 p-6 glass-panel border-cyan-400/40 bg-cyan-500/5 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="inline-flex p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">You're on a Free Trial</h3>
                <p className="text-gray-300 mb-1">
                  You have <strong className="text-white">{typeof trialDaysRemaining === "number" ? trialDaysRemaining : "a few"} days</strong> remaining in your 7-day trial.
                </p>
                <p className="text-sm text-gray-400">
                  Subscribe before <strong className="text-white">{safeDateString(subscription.trial_end)}</strong> to continue using all features without interruption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan selection */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">Choose Your Plan</h2>
            <p className="text-gray-400 text-lg">Select the perfect plan for your production needs</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pro Card */}
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
                <CardTitle className="text-3xl font-bold text-white mb-2">Pro</CardTitle>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold gradient-text">$9.99</span>
                  <span className="text-gray-400 text-lg">/month</span>
                </div>
                <CardDescription className="text-base text-gray-300">Perfect for individual professionals and freelancers</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">What's Included</h4>
                  {[
                    { icon: CheckCircle2, text: "Access to all 35+ professional tools" },
                    { icon: CheckCircle2, text: "Unlimited exports (PDF, CSV, JSON)" },
                    { icon: CheckCircle2, text: "Cloud sync & preset management" },
                    { icon: CheckCircle2, text: "PWA installable (works offline)" },
                    { icon: CheckCircle2, text: "Regular tool updates & new features" },
                    { icon: CheckCircle2, text: "Email support (24hr response)" },
                    { icon: CheckCircle2, text: "1 user license" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <feature.icon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/10" />

                {currentTier === "pro" ? (
                  <>
                    <div className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Info className="w-4 h-4" />
                        <span className="text-sm font-semibold">Active Subscription</span>
                      </div>
                      <p className="text-sm text-gray-300">You're currently on the Pro plan. Need team features? Upgrade to Team below!</p>
                    </div>
                    {subscription.status !== "canceled" && (
                      <Button
                        variant="outline"
                        className="w-full border-red-400/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Full JSX PayPal form (no dangerouslySetInnerHTML) */}
                    <form action="https://www.paypal.com/ncp/payment/BA5M2737P3VBE" method="post" target="_blank" className="w-full">
                      <button
                        type="submit"
                        className="w-full rounded-md py-3 font-semibold text-white text-center"
                        style={{
                          background: "linear-gradient(135deg, #00E8FF 0%, #9B5CFF 100%)",
                        }}
                      >
                        Subscribe to Pro Plan
                      </button>
                    </form>
                    <p className="text-center text-sm text-gray-400 mt-3">7-day free trial • No credit card required • Cancel anytime</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team Card */}
            <Card
              className={`glass-panel relative overflow-hidden transition-all ${
                currentTier === "team"
                  ? "border-violet-400/60 shadow-[0_0_30px_rgba(155,92,255,0.2)]"
                  : "border-white/10 hover:border-violet-400/40"
              }`}
            >
              <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-xs font-bold rounded-bl-lg flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {currentTier === "team" ? "CURRENT PLAN" : "MOST POPULAR"}
              </div>

              <CardHeader className="pb-4">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 w-fit mb-4">
                  <Users className="w-8 h-8 text-violet-400" />
                </div>
                <CardTitle className="text-3xl font-bold text-white mb-2">Team</CardTitle>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">$99.99</span>
                  <span className="text-gray-400 text-lg">/month</span>
                </div>
                <CardDescription className="text-base text-gray-300">Built for production teams and companies</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Everything in Pro, plus:</h4>
                  {[
                    { icon: Users, text: "Up to 30 team members", highlight: true },
                    { icon: Shield, text: "Shared projects & preset libraries", highlight: true },
                    { icon: TrendingUp, text: "Team activity tracking & analytics", highlight: true },
                    { icon: Crown, text: "Advanced role & permission management", highlight: true },
                    { icon: Zap, text: "Priority support & onboarding", highlight: true },
                    { icon: CheckCircle2, text: "Dedicated account manager (10+ seats)" },
                    { icon: CheckCircle2, text: "Custom team branding (coming soon)" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <feature.icon className={`w-5 h-5 ${feature.highlight ? "text-violet-400" : "text-cyan-400"} mt-0.5 flex-shrink-0`} />
                      <span className={feature.highlight ? "text-white font-medium" : "text-gray-300"}>{feature.text}</span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/10" />

                {currentTier === "team" ? (
                  <>
                    <div className="p-4 bg-violet-500/10 border border-violet-400/30 rounded-lg">
                      <div className="flex items-center gap-2 text-violet-400 mb-2">
                        <Crown className="w-4 h-4" />
                        <span className="text-sm font-semibold">Active Team Plan</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-3">You have access to all team features and can manage up to 30 members.</p>
                      <Link href="/teams">
                        <Button variant="outline" size="sm" className="w-full border-violet-400/50">
                          Manage Team
                        </Button>
                      </Link>
                    </div>
                    {subscription.status !== "canceled" && (
                      <Button
                        variant="outline"
                        className="w-full border-red-400/50 text-red-400 hover:bg-red-500/10"
                        onClick={() => setCancelDialogOpen(true)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <form action="https://www.paypal.com/ncp/payment/FEC47P2HBV9K6" method="post" target="_blank" className="w-full">
                      <button
                        type="submit"
                        className="w-full rounded-md py-3 font-semibold text-white text-center"
                        style={{
                          background: "linear-gradient(135deg, #9B5CFF 0%, #FF008C 100%)",
                        }}
                      >
                        Subscribe to Team Plan
                      </button>
                    </form>
                    <p className="text-center text-sm text-gray-400 mt-3">7-day free trial • No credit card required • Cancel anytime</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <div className="inline-flex p-3 rounded-lg bg-cyan-500/10 w-fit mb-2">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <CardTitle className="text-lg">Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">All payments are processed securely through PayPal. Your financial information is never stored on our servers.</p>
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
              <p className="text-sm text-gray-400">No long-term contracts. Cancel your subscription anytime and keep access until the end of your billing period.</p>
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
              <p className="text-sm text-gray-400">Start using all features immediately after subscribing. No waiting period or complex setup required.</p>
            </CardContent>
          </Card>
        </div>

        {/* Details + history */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                      {subscription.tier === "pro" ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                      {subscription.tier ?? "—"}
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className="text-lg font-bold capitalize">{getStatusBadge()}</div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-sm text-gray-400 mb-1">Monthly Cost</div>
                    <div className="text-lg font-bold text-white">${subscription.tier === "pro" ? "9.99" : "99.99"}</div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-sm text-gray-400 mb-1">Team Seats</div>
                    <div className="text-lg font-bold text-white">{subscription.tier === "pro" ? "1 user" : `Up to ${subscription.seats ?? 30} users`}</div>
                  </div>
                </div>

                {isOnTrial && (
                  <div className="p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">Free Trial Period</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Started:</span>
                        <span className="text-white ml-2">{safeDateString(subscription.trial_start)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Ends:</span>
                        <span className="text-white ml-2">{safeDateString(subscription.trial_end)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {subscription.paypal_transaction_id && (
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="text-sm font-semibold">Payment Information</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-400">Transaction ID:</span>
                      <code className="ml-2 text-xs text-cyan-400 font-mono">{(subscription.paypal_transaction_id ?? "").slice(0, 24)}...</code>
                    </div>
                  </div>
                )}
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
                        className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                            <Calendar className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white capitalize">
                              {change.reason}
                              {change.from_tier ? `: ${change.from_tier} → ${change.to_tier}` : `: ${change.to_tier}`}
                            </p>
                            <p className="text-xs text-gray-400">{safeDateTimeString(change.created_at)}</p>
                          </div>
                        </div>
                        {change.paypal_transaction_id && (
                          <Badge variant="outline" className="text-xs border-green-400/50 text-green-400">
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

          <div className="space-y-6">
            <Card className="glass-panel border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
                <CardDescription>We're here to assist you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/contact">
                  <Button variant="outline" className="w-full">Contact Support</Button>
                </Link>
                <Link href="/faq">
                  <Button variant="outline" className="w-full">View FAQ</Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" className="w-full">About Stage Tech Pro</Button>
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
                <p><strong className="text-white">Billing Cycle:</strong> Monthly, charged on the same day each month</p>
                <p><strong className="text-white">Payment Method:</strong> PayPal (credit card, debit card, or PayPal balance)</p>
                <p><strong className="text-white">Refund Policy:</strong> Pro-rated refunds available within 30 days</p>
                <Separator className="bg-white/10" />
                <p className="text-xs text-gray-400">All subscriptions automatically renew. Cancel anytime from this page.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancel dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="glass-panel border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to cancel your subscription? Here's what will happen:
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 py-4">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">You'll keep access until the end of your billing period</span>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">Your data and presets will be preserved</span>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">You can reactivate anytime by subscribing again</span>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelSubscription} className="bg-red-500 hover:bg-red-600" disabled={loadingAction}>
                {loadingAction ? "Canceling..." : "Yes, Cancel"}
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
