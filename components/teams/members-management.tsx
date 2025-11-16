"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreVertical, Mail, Shield, UserMinus, Ban, CheckCircle, RefreshCw, Crown, UserCog } from "lucide-react";
import { TeamMember } from "@/lib/team-service";

interface MembersManagementProps {
  teamId: string;
  members: TeamMember[];
  currentUserId: string;
  canManage: boolean;
  subscription?: { seats: number };
  onUpdateRole: (memberId: string, role: "owner" | "admin" | "member" | "viewer") => Promise<void>;
  onSuspendMember: (memberId: string) => Promise<void>;
  onReactivateMember: (memberId: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onResendInvitation: (memberId: string) => Promise<void>;
  onEditPermissions: (memberId: string) => void;
}

export function MembersManagement({
  teamId,
  members,
  currentUserId,
  canManage,
  subscription,
  onUpdateRole,
  onSuspendMember,
  onReactivateMember,
  onRemoveMember,
  onResendInvitation,
  onEditPermissions,
}: MembersManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      searchTerm === "" ||
      member.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.invitation_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    const memberStatus = member.joined_at ? (member.status || "active") : "pending";
    const matchesStatus = statusFilter === "all" || memberStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeMembers = members.filter((m) => m.joined_at && m.status === "active");
  const pendingInvitations = members.filter((m) => !m.joined_at);

  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "border-cyan-400/50 text-cyan-400";
      case "admin":
        return "border-violet-400/50 text-violet-400";
      case "member":
        return "border-gray-400/50 text-gray-400";
      case "viewer":
        return "border-gray-500/50 text-gray-500";
      default:
        return "";
    }
  };

  const handleAction = async (action: () => Promise<void>, loadingKey: string) => {
    try {
      setActionLoading(loadingKey);
      await action();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {activeMembers.length} of {subscription?.seats || 30} seats used
                {pendingInvitations.length > 0 && ` • ${pendingInvitations.length} pending invitations`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search members by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members list */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <Card className="glass-panel border-white/10">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">No members found matching your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const isPending = !member.joined_at;
            const isSuspended = member.status === "suspended";
            const isOwner = member.role === "owner";
            const canModify = canManage && !isCurrentUser && !isOwner;

            return (
              <Card key={member.id} className="glass-panel border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-500">
                          {member.profile
                            ? getUserInitials(member.profile.full_name, member.profile.email)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">
                            {member.profile?.full_name || member.profile?.email || member.invitation_email || "Pending"}
                            {isCurrentUser && <span className="text-cyan-400 text-sm ml-2">(You)</span>}
                          </h3>
                          {isOwner && <Crown className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <p className="text-sm text-gray-400">
                          {member.profile?.email || member.invitation_email}
                        </p>
                        {member.last_active && (
                          <p className="text-xs text-gray-500 mt-1">
                            Last active: {new Date(member.last_active).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                          {member.role === "owner" && <Shield className="w-3 h-3 mr-1" />}
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                        {isPending && (
                          <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-400">
                            <Mail className="w-3 h-3 mr-1" />
                            Invitation Pending
                          </Badge>
                        )}
                        {isSuspended && (
                          <Badge variant="outline" className="text-xs border-red-400/50 text-red-400">
                            <Ban className="w-3 h-3 mr-1" />
                            Suspended
                          </Badge>
                        )}
                      </div>

                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => onEditPermissions(member.id)}>
                              <UserCog className="w-4 h-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>

                            {!isPending && (
                              <>
                                <DropdownMenuLabel className="text-xs">Change Role</DropdownMenuLabel>
                                {["admin", "member", "viewer"].map((role) => (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() =>
                                      handleAction(
                                        () => onUpdateRole(member.id, role as any),
                                        `role-${member.id}`
                                      )
                                    }
                                    disabled={actionLoading === `role-${member.id}` || member.role === role}
                                  >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {isPending && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(
                                    () => onResendInvitation(member.id),
                                    `resend-${member.id}`
                                  )
                                }
                                disabled={actionLoading === `resend-${member.id}`}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                            )}

                            {!isPending && !isSuspended && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(
                                    () => onSuspendMember(member.id),
                                    `suspend-${member.id}`
                                  )
                                }
                                disabled={actionLoading === `suspend-${member.id}`}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend Member
                              </DropdownMenuItem>
                            )}

                            {isSuspended && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleAction(
                                    () => onReactivateMember(member.id),
                                    `reactivate-${member.id}`
                                  )
                                }
                                disabled={actionLoading === `reactivate-${member.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reactivate Member
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
                              onClick={() => setRemovingMemberId(member.id)}
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Remove member confirmation dialog */}
      <AlertDialog open={!!removingMemberId} onOpenChange={() => setRemovingMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the team? They will lose access to all team projects
              and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removingMemberId) {
                  handleAction(() => onRemoveMember(removingMemberId), `remove-${removingMemberId}`);
                  setRemovingMemberId(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
