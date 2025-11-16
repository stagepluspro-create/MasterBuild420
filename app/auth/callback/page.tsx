"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { dbService } from "@/lib/db-service";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const teamId = urlParams.get("team_id");
      const returnUrl = urlParams.get("returnUrl") || "/dashboard";

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        router.push("/auth/signin?error=callback_failed");
        return;
      }

      if (session?.user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .maybeSingle();

        const isNewUser = !existingProfile;

        if (isNewUser) {
          await dbService.createProfile({
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
          });

          const tierFromMeta = session.user.user_metadata?.tier || "pro";
          const seats = tierFromMeta === "team" ? 30 : 1;

          await dbService.createSubscription({
            user_id: session.user.id,
            tier: tierFromMeta,
            seats: seats,
          });

          await dbService.createAuditLog({
            user_id: session.user.id,
            action: "account_created",
            meta: { provider: "google" },
          });
        } else {
          await dbService.createAuditLog({
            user_id: session.user.id,
            action: "signin",
            meta: { provider: "google" },
          });
        }

        if (teamId) {
          const inviteTeamId = session.user.user_metadata?.team_id || teamId;
          const inviteRole = session.user.user_metadata?.role || "member";

          const { data: existingMember } = await supabase
            .from("team_members")
            .select("id")
            .eq("team_id", inviteTeamId)
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!existingMember) {
            await supabase.from("team_members").insert({
              team_id: inviteTeamId,
              user_id: session.user.id,
              role: inviteRole,
              joined_at: new Date().toISOString(),
            });

            await dbService.createAuditLog({
              user_id: session.user.id,
              action: "team_joined",
              meta: { team_id: inviteTeamId },
            });
          }

          router.push(`/teams/${inviteTeamId}`);
        } else {
          router.push(decodeURIComponent(returnUrl));
        }
      } else {
        router.push("/auth/signin");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
