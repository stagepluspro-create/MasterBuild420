"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  // While loading auth, show a lightweight placeholder (NOT null)
  if (loading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center text-gray-400">
        Checking authentication…
      </div>
    );
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // If no user yet, hide the content but DO NOT return null
  if (!user) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center text-gray-400">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
