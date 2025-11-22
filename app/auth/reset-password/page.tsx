"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
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

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
      });

      if (resetError) throw resetError;

      setSent(true);
    } catch (err: any) {
      console.error("Reset password error:", err);
      setError(err.message || "Failed to send reset email. Please try again.");
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
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </div>

          <Card className="glass-panel border-cyan-400/30 bg-cyan-500/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="text-base text-gray-300 mt-2">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-sm text-gray-300 mb-3">
                  Click the link in your email to reset your password. The link will expire in 1 hour.
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
                Remember your password?{" "}
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
            href="/auth/signin"
            className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        <Card className="glass-panel">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-orange-400" />
            </div>
            <CardTitle className="text-3xl font-bold gradient-text mb-2">Reset Password</CardTitle>
            <CardDescription className="text-base text-gray-300">
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

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
                    className="pl-10 bg-white/5 border-white/10 focus:border-orange-400/50 focus:ring-orange-400/20"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400">
                  We'll send you a secure link to reset your password
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Remember your password?{" "}
                  <Link href="/auth/signin" className="text-cyan-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
                <p className="text-sm text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-cyan-400 hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 text-center">
            <strong className="text-gray-300">Security Note:</strong> For your protection, password reset links expire after 1 hour and can only be used once.
          </p>
        </div>
      </div>
    </div>
  );
}
