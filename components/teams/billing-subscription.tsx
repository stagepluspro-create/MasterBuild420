"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Calendar, Users, TrendingUp, Download, AlertCircle } from "lucide-react";

interface BillingSubscriptionProps {
  subscription: {
    id: string;
    tier: "pro" | "team";
    status: "trial" | "active" | "expired" | "canceled";
    trial_start: string;
    trial_end: string;
    seats: number;
    paypal_transaction_id: string | null;
    created_at: string;
  };
  memberCount: number;
  onUpgrade: () => void;
  onDowngrade: () => void;
  onManagePayment: () => void;
}

export function BillingSubscription({
  subscription,
  memberCount,
  onUpgrade,
  onDowngrade,
  onManagePayment,
}: BillingSubscriptionProps) {
  const isTrialActive = subscription.status === "trial";
  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const seatsUsedPercentage = (memberCount / subscription.seats) * 100;

  const tierDetails = {
    pro: {
      name: "Pro",
      price: "$9.99",
      color: "from-cyan-500 to-blue-500",
      features: ["1 team member", "All tools included", "Priority support", "Unlimited projects"],
    },
    team: {
      name: "Team",
      price: "$99.99",
      color: "from-violet-500 to-purple-500",
      features: ["Up to 30 members", "All tools included", "Priority support", "Unlimited projects", "Team analytics"],
    },
  };

  const currentTier = tierDetails[subscription.tier];

  const getStatusBadge = () => {
    switch (subscription.status) {
      case "trial":
        return <Badge className="bg-blue-500">Trial - {daysRemaining} days left</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-500">Expired</Badge>;
      case "canceled":
        return <Badge className="bg-gray-500">Canceled</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Current Subscription
              </CardTitle>
              <CardDescription>Manage your team&apos;s billing and subscription</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`p-6 rounded-lg bg-gradient-to-br ${currentTier.color} bg-opacity-10`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white">{currentTier.name} Plan</h3>
                <p className="text-3xl font-bold text-white mt-1">
                  {currentTier.price}
                  <span className="text-sm font-normal text-gray-300">/month</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">Billing cycle</p>
                <p className="text-lg font-semibold text-white">Monthly</p>
              </div>
            </div>

            <ul className="space-y-2">
              {currentTier.features.map((feature, index) => (
                <li key={index} className="flex items-center text-white text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-2" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {isTrialActive && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-300">Trial Period Active</p>
                  <p className="text-sm text-blue-200 mt-1">
                    Your {daysRemaining}-day trial ends on {trialEnd.toLocaleDateString()}.
                    Add a payment method before the trial expires to continue using the service.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {subscription.tier === "pro" && (
              <Button onClick={onUpgrade} className="flex-1">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade to Team
              </Button>
            )}
            {subscription.tier === "team" && (
              <Button onClick={onDowngrade} variant="outline" className="flex-1">
                Downgrade to Pro
              </Button>
            )}
            <Button onClick={onManagePayment} variant="outline" className="flex-1">
              Manage Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seat Usage */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Seat Usage
          </CardTitle>
          <CardDescription>
            {memberCount} of {subscription.seats} seats used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Usage</span>
              <span className="text-white font-semibold">{Math.round(seatsUsedPercentage)}%</span>
            </div>
            <Progress value={seatsUsedPercentage} className="h-2" />
          </div>

          {seatsUsedPercentage > 80 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                You&apos;re approaching your seat limit. Consider upgrading to add more team members.
              </p>
            </div>
          )}

          {subscription.tier === "pro" && memberCount >= subscription.seats && (
            <Button onClick={onUpgrade} className="w-full">
              Upgrade to Team for 30 Seats
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Billing History
              </CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock invoice data */}
            {isTrialActive ? (
              <p className="text-center text-gray-400 py-8">
                No billing history yet. Your first invoice will appear after the trial period.
              </p>
            ) : (
              <>
                {[
                  {
                    id: "INV-001",
                    date: new Date().toLocaleDateString(),
                    amount: currentTier.price,
                    status: "Paid",
                  },
                ].map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/10 rounded">
                        <CreditCard className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{invoice.id}</p>
                        <p className="text-sm text-gray-400">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-white">{invoice.amount}</p>
                        <Badge variant="outline" className="text-xs border-green-400/50 text-green-400">
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription.paypal_transaction_id ? (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">PayPal</p>
                  <p className="text-sm text-gray-400">Connected account</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onManagePayment}>
                Update
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No payment method on file</p>
              <Button onClick={onManagePayment}>Add Payment Method</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Billing */}
      {subscription.status === "active" && (
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>Next Billing Date</CardTitle>
            <CardDescription>Your next charge will occur on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-white">
                  {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-400 mt-1">Automatic renewal</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{currentTier.price}</p>
                <p className="text-sm text-gray-400 mt-1">{currentTier.name} Plan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
