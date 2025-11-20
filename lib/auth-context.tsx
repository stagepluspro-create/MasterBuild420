"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserSupabase } from './supabase-client';

type Profile = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = getBrowserSupabase();

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data: { user: currentUser }} = await supabase.auth.getUser();

      if (!mounted) return;

      setUser(currentUser ?? null);

      if (currentUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(data ?? null);
      }

      setLoading(false);
    }

    init();

    const { subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', nextUser.id).single();
        setProfile(data ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      if (subscription) supabase.auth.removeSubscription(subscription);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
