export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function Page({ searchParams }: any) {
  const code = searchParams?.code;

  if (code) {
    const supabase = createServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  redirect("/");
}
