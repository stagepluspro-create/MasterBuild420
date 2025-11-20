"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

export function createBrowserClient() {
  return createPagesBrowserClient();
}
