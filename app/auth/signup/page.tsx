"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { dbService } from "@/lib/db-service";
import Link from "next/link";
import { Check, Users, User } from "lucide-react";

type SubscriptionTier = "pro" | "team";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("pro");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"tier" | "details">("tier");
  const router = useRouter();

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError("");

      if (selectedTier === "team" && !teamName.trim()) {
        setError("Team name is required for Team subscription");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        await dbService.createProfile({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName || undefined,
        });

        const seats = selectedTier === "team" ? 30 : 1;

        await dbService.createSubscription({
          user_id: data.user.id,
          tier: selectedTier,
          seats: seats,
        });

        if (selectedTier === "team") {
          const { data: team, error: teamError } = await supabase
            .from("teams")
            .insert({
              owner_user_id: data.user.id,
              name: teamName,
            })
            .select()
            .single();

          if (teamError) throw teamError;

          await supabase.from("team_members").insert({
            team_id: team.id,
            user_id: data.user.id,
            role: "owner",
            joined_at: new Date().toISOString(),
          });

          await dbService.createAuditLog({
            user_id: data.user.id,
            action: "team_created",
            meta: { team_id: team.id, team_name: teamName },
          });
        }

        await dbService.createAuditLog({
          user_id: data.user.id,
          action: "account_created",
          meta: { tier: selectedTier },
        });
      }

      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const tierFeatures = {
    pro: [
      "All 35+ professional tools",
      "Unlimited exports",
      "Cloud sync & backups",
      "PWA offline mode",
      "Priority email support",
      "1 member",
    ],
    team: [
      "Everything in Pro",
      "Up to 30 team members",
      "Shared projects & presets",
      "Team activity tracking",
      "Member role management",
      "Priority support & training",
    ],
  };

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-3">Create Your Account</h1>
          <p className="text-gray-300">Choose your plan and start your 7-day free trial</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        {step === "tier" ? (
          <div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedTier === "pro"
                    ? "border-cyan-400/60 shadow-[0_0_20px_rgba(0,232,255,0.3)] scale-[1.02]"
                    : "border-white/10 hover:border-cyan-400/30"
                }`}
                onClick={() => setSelectedTier("pro")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    {selectedTier === "pro" && (
                      <Badge className="bg-cyan-500">Selected</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">Pro</CardTitle>
                  <CardDescription className="text-lg font-semibold text-white">
                    $9.99/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tierFeatures.pro.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedTier === "team"
                    ? "border-cyan-400/60 shadow-[0_0_20px_rgba(0,232,255,0.3)] scale-[1.02]"
                    : "border-white/10 hover:border-cyan-400/30"
                }`}
                onClick={() => setSelectedTier("team")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                    {selectedTier === "team" && (
                      <Badge className="bg-cyan-500">Selected</Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">Team</CardTitle>
                  <CardDescription className="text-lg font-semibold text-white">
                    $99.99/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tierFeatures.team.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button onClick={() => setStep("details")} size="lg">
                Continue with {selectedTier === "pro" ? "Pro" : "Team"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto glass-panel p-8">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setStep("tier")}
                className="mb-4"
              >
                ← Back to plan selection
              </Button>
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedTier === "pro" ? "Pro" : "Team"} Account Details
              </h2>
              <p className="text-sm text-gray-400">
                Creating {selectedTier === "pro" ? "Pro" : "Team"} subscription ($
                {selectedTier === "pro" ? "9.99" : "99.99"}/month)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  Full Name (optional)
                </label>
                <Input
                  placeholder="Your name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {selectedTier === "team" && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">
                    Team Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Production Crew"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can invite team members after signup
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email</label>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Password</label>
                <Input
                  placeholder="Min 6 characters"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
                />
              </div>

              <Button className="w-full" onClick={handleSignUp} disabled={loading}>
                {loading ? "Creating account..." : "Start Free Trial"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-gray-400">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                Sign up with Google
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                7-day free trial • No credit card required • Cancel anytime
              </p>
            </div>

            <p className="text-sm text-gray-400 mt-6 text-center">
              Already have an account?{" "}
              <Link href="/auth/signin" className="underline hover:text-white">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
