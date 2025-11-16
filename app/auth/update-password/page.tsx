"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleUpdatePassword = async () => {
    try {
      setLoading(true);
      setError("");

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      router.push("/auth/signin?reset=success");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 px-4">
      <div className="max-w-md mx-auto glass-panel p-8">
        <h1 className="text-3xl font-bold gradient-text mb-6">Update Password</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <p className="text-gray-400 mb-6 text-sm">
          Enter your new password below.
        </p>

        <div className="space-y-4">
          <Input
            placeholder="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUpdatePassword()}
          />
          <Button
            className="w-full"
            onClick={handleUpdatePassword}
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
}
