"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, Sparkles, CheckCircle2, Crown } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      setSent(true);
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to send verification link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>

          <Card className="glass-panel border-cyan-400/30 bg-cyan-500/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="text-base text-gray-300 mt-2">
                We've sent a verification link to <strong className="text-white">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-300 mb-3">
                  Click the link in your email to verify your account and start your 7-day free trial.
                </p>
                <div className="flex items-start gap-2 text-xs text-gray-400 text-left">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                  <span>If you don't see the email, check your spam folder</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Use a different email
              </Button>
              <p className="text-xs text-center text-gray-400">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-cyan-400 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>

        <Card className="glass-panel">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-violet-400" />
            </div>
            <CardTitle className="text-3xl font-bold gradient-text mb-2">Start Your Free Trial</CardTitle>
            <CardDescription className="text-base text-gray-300">
              Join thousands of production professionals worldwide
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 bg-violet-500/10 border border-violet-400/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">7-Day Free Trial Included</h4>
                    <p className="text-xs text-gray-300">
                      Full access to all 35+ tools • No credit card required
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/5 border-white/10 focus:border-violet-400/50 focus:ring-violet-400/20"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400">
                  We'll send you a verification link to get started
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-4 w-4" />
                    Start Free Trial
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-cyan-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <p className="text-xs text-gray-500">
                  By signing up, you agree to our{" "}
                  <Link href="/terms" className="text-gray-400 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-gray-400 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-4">What you'll get with your free trial:</p>
          <div className="grid grid-cols-1 gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Access to all 35+ professional tools</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Cloud sync & preset management</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>PWA installable (works offline)</span>
            </div>
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>No credit card required for trial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
