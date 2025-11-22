"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { invitationService } from "@/lib/invitation-service";
import { Button } from "@/components/ui/button";
import { User, LogOut, Settings, CreditCard, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, subscription, loading, signOut, isTrialActive, trialDaysRemaining } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState(0);

  useEffect(() => {
    if (user?.email) {
      loadPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadPendingInvitations = async () => {
    if (!user?.email) return;

    try {
      const invitations = await invitationService.getPendingInvitationsForUser(user.email);
      setPendingInvitations(invitations.length);
    } catch (error) {
      console.error("Failed to load pending invitations:", error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between glass-panel">
        <Link href="/" className="font-bold gradient-text text-xl">
          Stage Tech Pro
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/tools" className="text-sm hover:opacity-90">
            Tools
          </Link>
          <Link href="/dashboard" className="text-sm hover:opacity-90">
            Dashboard
          </Link>
          <Link href="/teams" className="text-sm hover:opacity-90">
            Teams
          </Link>
          <Link href="/pricing" className="text-sm hover:opacity-90">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm hover:opacity-90">
            Docs
          </Link>

          {loading && (
            <div className="flex items-center gap-4">
              <div className="h-8 w-20 bg-white/5 rounded-md animate-pulse"></div>
              <div className="h-8 w-32 bg-white/5 rounded-md animate-pulse"></div>
            </div>
          )}

          {!loading && !user && (
            <>
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-md bg-white/10 text-sm hover:bg-white/15 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-md btn-gradient text-sm hover:opacity-90 transition-opacity"
              >
                Start Free Trial
              </Link>
            </>
          )}

          {!loading && user && (
            <div className="flex items-center gap-4">
              {pendingInvitations > 0 && (
                <Link href="/teams/invitations">
                  <div className="relative text-xs bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full hover:bg-cyan-500/30 transition-colors cursor-pointer flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {pendingInvitations} {pendingInvitations === 1 ? "Invitation" : "Invitations"}
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                  </div>
                </Link>
              )}
              {isTrialActive && (
                <div className="text-xs bg-cyan-500/20 border border-cyan-500/30 px-3 py-1 rounded-full">
                  Trial: {trialDaysRemaining}d left
                </div>
              )}
              {subscription?.tier && (
                <div className="text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full capitalize">
                  {subscription.tier}
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-gray-400">
                        {profile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile/subscription")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Subscription
                  </DropdownMenuItem>
                  {pendingInvitations > 0 && (
                    <DropdownMenuItem onClick={() => router.push("/teams/invitations")}>
                      <Mail className="mr-2 h-4 w-4" />
                      Team Invitations ({pendingInvitations})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
