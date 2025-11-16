"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 px-4">
      <div className="max-w-md mx-auto glass-panel p-8">
        <h1 className="text-3xl font-bold gradient-text mb-6">Reset Password</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              Password reset link sent! Check your email inbox for instructions.
            </div>
            <Link href="/auth/signin">
              <Button className="w-full">Back to Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-6 text-sm">
              Enter your email address and we will send you a link to reset your
              password.
            </p>
            <div className="space-y-4">
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
              />
              <Button
                className="w-full"
                onClick={handleResetPassword}
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-4 text-center">
              Remember your password?{" "}
              <Link href="/auth/signin" className="underline hover:text-white">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
