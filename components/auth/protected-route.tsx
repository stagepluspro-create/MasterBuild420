"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // While loading, show nothing (no spinner to avoid re-renders)
  if (loading) return null;

  useEffect(() => {
    // Redirect ONLY after loading finishes
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Do NOT render until redirect decision is complete
  if (!user) return null;

  return <>{children}</>;
}
