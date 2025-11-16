"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "./supabase";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, retries = 3): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Exception fetching profile:", err);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchProfile(userId, retries - 1);
      }
    }
  };

  const fetchSubscription = async (userId: string, retries = 3): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchSubscription(userId, retries - 1);
        }
        return;
      }

      if (data) {
        setSubscription(data);
      }
    } catch (err) {
      console.error("Exception fetching subscription:", err);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchSubscription(userId, retries - 1);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Failsafe: ensure loading state resolves even if something goes wrong
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth initialization timeout - forcing loading to false");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id)
          ]);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Exception initializing auth:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await Promise.all([
            fetchProfile(session.user.id),
            fetchSubscription(session.user.id)
          ]);
        } else {
          setProfile(null);
          setSubscription(null);
        }

        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      authListener.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setSession(null);
  };

  const isSubscriptionActive =
    subscription?.status === "active" || subscription?.status === "trial";

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
          (new Date(subscription.trial_end).getTime() - new Date().getTime()) /
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
