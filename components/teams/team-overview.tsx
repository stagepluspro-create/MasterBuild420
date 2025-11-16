"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FolderOpen, Activity, Calendar, Settings, UserPlus, Plus, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface TeamOverviewProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    contact_email: string | null;
    owner_user_id: string;
    member_count: number;
    created_at: string;
  };
  stats: {
    activeMembers: number;
    totalProjects: number;
    recentActivityCount: number;
    lastActivity: string | null;
  };
  currentUserId: string;
  isOwner: boolean;
  isAdmin: boolean;
  onInviteMember: () => void;
  onCreateProject: () => void;
  onSettings: () => void;
}

export function TeamOverview({
  team,
  stats,
  currentUserId,
  isOwner,
  isAdmin,
  onInviteMember,
  onCreateProject,
  onSettings,
}: TeamOverviewProps) {
  const canManage = isOwner || isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          {team.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={team.logo_url}
              alt={team.name}
              className="w-20 h-20 rounded-lg object-cover border border-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-cyan-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold gradient-text">{team.name}</h1>
              {isOwner && (
                <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                  <Crown className="w-3 h-3 mr-1" />
                  Owner
                </Badge>
              )}
              {isAdmin && !isOwner && (
                <Badge variant="outline" className="border-violet-400/50 text-violet-400">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-gray-400 mb-1">{team.description || "No description provided"}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(team.created_at).toLocaleDateString()}
              </span>
              {team.contact_email && <span>Contact: {team.contact_email}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button variant="outline" onClick={onInviteMember}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
              <Button onClick={onCreateProject}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
              <Button variant="ghost" size="icon" onClick={onSettings}>
                <Settings className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Members</CardTitle>
            <Users className="h-5 w-5 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeMembers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.activeMembers} of {team.member_count} total
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Projects</CardTitle>
            <FolderOpen className="h-5 w-5 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
            <p className="text-xs text-gray-500 mt-1">Active productions</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Recent Activity</CardTitle>
            <Activity className="h-5 w-5 text-magenta-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.recentActivityCount}</div>
            <p className="text-xs text-gray-500 mt-1">Events this week</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Team Health</CardTitle>
            <div
              className={`h-3 w-3 rounded-full ${stats.lastActivity && new Date(stats.lastActivity).getTime() > Date.now() - 24 * 60 * 60 * 1000 ? "bg-green-400" : "bg-yellow-400"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-white">
              {stats.lastActivity && new Date(stats.lastActivity).getTime() > Date.now() - 24 * 60 * 60 * 1000
                ? "Active"
                : "Moderate"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.lastActivity
                ? `Last activity ${new Date(stats.lastActivity).toLocaleDateString()}`
                : "No recent activity"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {canManage && (
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks for team management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={onInviteMember}>
                <UserPlus className="w-6 h-6 text-cyan-400" />
                <span className="text-sm">Invite Member</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={onCreateProject}>
                <Plus className="w-6 h-6 text-violet-400" />
                <span className="text-sm">New Project</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Activity className="w-6 h-6 text-magenta-400" />
                <span className="text-sm">View Reports</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={onSettings}>
                <Settings className="w-6 h-6 text-cyan-400" />
                <span className="text-sm">Team Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
