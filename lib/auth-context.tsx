/**
 * Authentication Context Provider
 *
 * This provides user authentication state throughout the application.
 * It uses Supabase Auth and listens for auth state changes.
 *
 * Usage:
 *   Wrap your app with <AuthProvider> in app/layout.tsx
 *   Then use the useAuth() hook in any component:
 *
 *   const { user, profile, subscription, signOut } = useAuth()
 *
 * Features:
 *   - Automatically loads user profile from Supabase
 *   - Loads subscription data
 *   - Provides trial status helpers
 *   - Handles sign out
 *   - Listens for auth changes in real-time
 */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

type Profile = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

type Subscription = {
  id: string;
  user_id: string;
  tier: "pro" | "team";
  status: "active" | "trial" | "expired" | "canceled";
  seats: number;
  trial_start: string;
  trial_end: string;
  paypal_transaction_id?: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return data;
  };

  const loadSubscription = async (userId: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  };

  const ensureSubscription = async (userId: string) => {
    // Try to load existing subscription
    let sub = await loadSubscription(userId);

    // If no subscription exists, create one via API
    if (!sub) {
      try {
        const response = await fetch('/api/auth/ensure-subscription', {
          method: 'POST',
        });

        if (response.ok) {
          const result = await response.json();
          sub = result.subscription;
        }
      } catch (error) {
        console.error('Failed to auto-create subscription:', error);
      }
    }

    return sub;
  };

  const refreshSubscription = async () => {
    if (!user) return;
    const sub = await ensureSubscription(user.id);
    setSubscription(sub);
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | undefined;

    async function initialize() {
      try {
        // Set a more generous timeout (30 seconds)
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn("Auth initialization timeout after 30s - setting loading to false");
            setLoading(false);
          }
        }, 30000);

        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
        }

        const currentUser = data?.user ?? null;

        if (!mounted) return;

        setUser(currentUser);

        if (currentUser) {
          const [profileData, subData] = await Promise.all([
            loadProfile(currentUser.id),
            ensureSubscription(currentUser.id),
          ]);

          if (mounted) {
            setProfile(profileData);
            setSubscription(subData);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    }

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          const [profileData, subData] = await Promise.all([
            loadProfile(nextUser.id),
            ensureSubscription(nextUser.id),
          ]);
          setProfile(profileData);
          setSubscription(subData);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscription(null);
  };

  const isTrialActive =
    subscription?.status === "trial" &&
    new Date(subscription.trial_end) > new Date();

  const isTrialExpired =
    subscription?.status === "trial" &&
    new Date(subscription.trial_end) <= new Date();

  const trialDaysRemaining = subscription?.trial_end
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_end).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        loading,
        signOut,
        refreshSubscription,
        isTrialActive,
        isTrialExpired,
        trialDaysRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
