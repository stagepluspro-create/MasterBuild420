"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// ---------- Interfaces ----------
interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  settings: {
    units: string;
    theme: string;
  };
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  tier: "pro" | "team";
  status: "trial" | "active" | "expired" | "canceled";
  trial_start: string;
  trial_end: string;
  seats: number;
  paypal_transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  session: Session | null;
  loading: boolean;

  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSubscription: () => Promise<void>;

  isSubscriptionActive: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =========================
//     Auth Provider
// =========================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [loading, setLoading] = useState(true);

  // ---------- DB Loaders ----------
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) setProfile(data);
  }

  async function fetchSubscription(userId: string) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) setSubscription(data);
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshSubscription = async () => {
    if (user) await fetchSubscription(user.id);
  };

  // =========================
  //        Initialization
  // =========================
  useEffect(() => {
    let active = true;

    const init = async () => {
      // 1) Immediately load current auth session WITHOUT blocking UI
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      setSession(session);
      setUser(session?.user ?? null);

      // 2) If user exists, load profile + subscription
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchSubscription(session.user.id),
        ]);
      }

      // 3) Loading finished — no timeout needed
      if (active) setLoading(false);
    };

    init();

    // 4) Listen for future auth changes (login, logout, refresh)
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id),
          ]);
        } else {
          setProfile(null);
          setSubscription(null);
        }

        setLoading(false);
      }
    );

    return () => {
      active = false;
      authListener.unsubscribe();
    };
  }, []);

  // ---------- Trial/Status Helpers ----------
  const isSubscriptionActive =
    subscription?.status === "active" ||
    subscription?.status === "trial";

  const isTrialActive =
    subscription?.status === "trial" &&
    new Date(subscription.trial_end) > new Date();

  const isTrialExpired =
    subscription?.status === "trial" &&
    new Date(subscription.trial_end) <= new Date();

  const trialDaysRemaining = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_end).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // ---------- Sign Out ----------
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        session,
        loading,
        signOut,
        refreshProfile,
        refreshSubscription,
        isSubscriptionActive,
        isTrialActive,
        isTrialExpired,
        trialDaysRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
