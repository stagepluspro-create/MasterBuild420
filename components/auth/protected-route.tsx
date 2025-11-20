"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // If still initializing auth — show nothing but avoid infinite loader
  if (loading) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="mt-4">Checking authentication…</p>
      </div>
    );
  }

  // If not logged in → redirect to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // If user is loading/redirecting, render nothing
  if (!user) return null;

  // User authenticated → render content
  return <>{children}</>;
}
