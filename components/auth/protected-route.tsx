"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isRedirecting) {
      setIsRedirecting(true);
      const returnUrl = encodeURIComponent(pathname || "/dashboard");
      router.push(`/auth/signin?returnUrl=${returnUrl}`);
    }
  }, [user, loading, router, pathname, isRedirecting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050510] via-[#0B0C1A] to-[#121227]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-300 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050510] via-[#0B0C1A] to-[#121227]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
          <p className="mt-4 text-gray-300 font-medium">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
