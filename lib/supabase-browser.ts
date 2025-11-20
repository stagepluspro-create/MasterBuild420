"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

let browserClient: ReturnType<typeof createPagesBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (!browserClient) {
    browserClient = createPagesBrowserClient();
  }
  return browserClient;
}
