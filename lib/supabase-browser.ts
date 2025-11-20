"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// NEW name (what the subscription page uses)
export function createBrowserClient() {
  return createPagesBrowserClient();
}

// OLD name (what all your auth pages still use)
export function createBrowserSupabase() {
  return createPagesBrowserClient();
}
