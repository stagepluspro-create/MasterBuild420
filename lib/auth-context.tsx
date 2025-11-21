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

  const refreshSubscription = async () => {
    if (!user) return;
    const sub = await loadSubscription(user.id);
    setSubscription(sub);
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    async function initialize() {
      try {
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn("Auth initialization timeout - setting loading to false");
            setLoading(false);
          }
        }, 10000);

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
            loadSubscription(currentUser.id),
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
          clearTimeout(timeoutId);
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
            loadSubscription(nextUser.id),
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
      clearTimeout(timeoutId);
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
