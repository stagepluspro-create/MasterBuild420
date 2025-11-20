"use client";

import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

export function createBrowserSupabase() {
  return createBrowserSupabaseClient();
}
