"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, session } = useAuth();

  // Internal flag: has Supabase finished FIRST auth check?
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Wait until auth-context has emitted the first session (null or not)
    if (session !== undefined) {
      setInitialized(true);
    }
  }, [session]);

  // While waiting for Supabase to emit the first auth event
  if (!initialized) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
        <div className="w-12 h-12 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="mt-4">Checking authentication…</p>
      </div>
    );
  }

  // Once initialized: if user is not logged in → redirect
  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
    }
  }, [initialized, user, router]);

  // Block content rendering until redirect resolves
  if (!user) return null;

  return <>{children}</>;
}
