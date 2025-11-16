"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import { Settings, Shield, Archive, Trash2, Users, Upload, Crown, AlertTriangle } from "lucide-react";
import { TeamSecuritySettings } from "@/lib/team-service";

interface TeamSettingsProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    contact_email: string | null;
    owner_user_id: string;
    settings: {
      units: string;
      theme: string;
    };
  };
  securitySettings: TeamSecuritySettings | null;
  members: Array<{ id: string; user_id: string; profile: { full_name: string | null; email: string } | null }>;
  currentUserId: string;
  isOwner: boolean;
  onUpdateTeam: (data: {
    name?: string;
    description?: string;
    logo_url?: string;
    contact_email?: string;
    settings?: Record<string, any>;
  }) => Promise<void>;
  onUpdateSecurity: (settings: {
    enforce_mfa?: boolean;
    allowed_email_domains?: string[];
    session_timeout_minutes?: number;
    ip_whitelist?: string[];
  }) => Promise<void>;
  onTransferOwnership: (newOwnerId: string) => Promise<void>;
  onArchiveTeam: () => Promise<void>;
  onDeleteTeam: () => Promise<void>;
}

export function TeamSettings({
  team,
  securitySettings,
  members,
  currentUserId,
  isOwner,
  onUpdateTeam,
  onUpdateSecurity,
  onTransferOwnership,
  onArchiveTeam,
  onDeleteTeam,
}: TeamSettingsProps) {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "dangerous">("general");
  const [teamName, setTeamName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  const [contactEmail, setContactEmail] = useState(team.contact_email || "");
  const [logoUrl, setLogoUrl] = useState(team.logo_url || "");
  const [units, setUnits] = useState(team.settings.units || "metric");
  const [theme, setTheme] = useState(team.settings.theme || "dark");

  const [enforceMFA, setEnforceMFA] = useState(securitySettings?.enforce_mfa || false);
  const [allowedDomains, setAllowedDomains] = useState(
    securitySettings?.allowed_email_domains?.join(", ") || ""
  );
  const [sessionTimeout, setSessionTimeout] = useState(
    securitySettings?.session_timeout_minutes?.toString() || "480"
  );
  const [ipWhitelist, setIpWhitelist] = useState(securitySettings?.ip_whitelist?.join(", ") || "");

  const [newOwner, setNewOwner] = useState<string>("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [saving, setSaving] = useState(false);

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await onUpdateTeam({
        name: teamName,
        description,
        contact_email: contactEmail,
        logo_url: logoUrl,
        settings: { units, theme },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    setSaving(true);
    try {
      await onUpdateSecurity({
        enforce_mfa: enforceMFA,
        allowed_email_domains: allowedDomains
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        session_timeout_minutes: parseInt(sessionTimeout) || 480,
        ip_whitelist: ipWhitelist
          .split(",")
          .map((ip) => ip.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  };

  const activeMembers = members.filter((m) => m.user_id && m.user_id !== currentUserId);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <Button
          variant="ghost"
          onClick={() => setActiveTab("general")}
          className={activeTab === "general" ? "border-b-2 border-cyan-400 rounded-none" : "rounded-none"}
        >
          <Settings className="w-4 h-4 mr-2" />
          General
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab("security")}
          className={activeTab === "security" ? "border-b-2 border-cyan-400 rounded-none" : "rounded-none"}
        >
          <Shield className="w-4 h-4 mr-2" />
          Security
        </Button>
        {isOwner && (
          <Button
            variant="ghost"
            onClick={() => setActiveTab("dangerous")}
            className={activeTab === "dangerous" ? "border-b-2 border-red-400 rounded-none" : "rounded-none"}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Dangerous Zone
          </Button>
        )}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage your team&apos;s basic information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your team..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="team@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <div className="flex gap-2">
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <Button variant="outline" size="icon">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {logoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt="Team logo preview" className="w-20 h-20 rounded-lg object-cover mt-2" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="units">Default Units</Label>
                <Select value={units} onValueChange={setUnits}>
                  <SelectTrigger id="units">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Default Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSaveGeneral} disabled={saving || !teamName.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Settings */}
      {activeTab === "security" && (
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Configure security policies for your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <div>
                <Label htmlFor="enforce-mfa" className="text-base font-semibold">
                  Enforce Multi-Factor Authentication
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Require all team members to enable MFA
                </p>
              </div>
              <Switch id="enforce-mfa" checked={enforceMFA} onCheckedChange={setEnforceMFA} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed-domains">Allowed Email Domains</Label>
              <Input
                id="allowed-domains"
                value={allowedDomains}
                onChange={(e) => setAllowedDomains(e.target.value)}
                placeholder="example.com, company.org (leave empty for any domain)"
              />
              <p className="text-xs text-gray-500">Comma-separated list of allowed domains</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                min="30"
                max="1440"
              />
              <p className="text-xs text-gray-500">How long before inactive sessions expire (30-1440 minutes)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ip-whitelist">IP Whitelist</Label>
              <Textarea
                id="ip-whitelist"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="192.168.1.0/24, 10.0.0.1 (leave empty to allow all IPs)"
                rows={3}
              />
              <p className="text-xs text-gray-500">Comma-separated list of allowed IP addresses or CIDR ranges</p>
            </div>

            <Button onClick={handleSaveSecurity} disabled={saving}>
              {saving ? "Saving..." : "Save Security Settings"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dangerous Zone */}
      {activeTab === "dangerous" && isOwner && (
        <div className="space-y-6">
          {/* Transfer Ownership */}
          <Card className="glass-panel border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <Crown className="w-5 h-5" />
                Transfer Ownership
              </CardTitle>
              <CardDescription>Transfer team ownership to another member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  Transferring ownership will make you an admin and give the new owner full control over the team.
                  This action cannot be undone without their cooperation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-owner">New Owner</Label>
                <Select value={newOwner} onValueChange={setNewOwner}>
                  <SelectTrigger id="new-owner">
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMembers.map((member) => (
                      <SelectItem key={member.id} value={member.user_id}>
                        {member.profile?.full_name || member.profile?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowTransferDialog(true)}
                disabled={!newOwner}
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
              >
                Transfer Ownership
              </Button>
            </CardContent>
          </Card>

          {/* Archive Team */}
          <Card className="glass-panel border-orange-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-400">
                <Archive className="w-5 h-5" />
                Archive Team
              </CardTitle>
              <CardDescription>Archive this team while preserving all data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-200">
                  Archiving will make the team read-only. Members will not be able to create or edit content.
                  You can restore the team at any time.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowArchiveDialog(true)}
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
              >
                Archive Team
              </Button>
            </CardContent>
          </Card>

          {/* Delete Team */}
          <Card className="glass-panel border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                Delete Team
              </CardTitle>
              <CardDescription>Permanently delete this team and all associated data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-200 font-semibold mb-2">
                  This action is irreversible!
                </p>
                <p className="text-sm text-red-200">
                  All team data, projects, presets, and member access will be permanently deleted.
                  This cannot be undone.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Delete Team Permanently
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Team Ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer ownership of this team? You will become an admin and the new owner
              will have full control over the team. This action requires confirmation from both parties.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (newOwner) {
                  await onTransferOwnership(newOwner);
                  setShowTransferDialog(false);
                  setNewOwner("");
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Transfer Ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make the team read-only. No one will be able to create or edit content.
              You can restore the team later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onArchiveTeam();
                setShowArchiveDialog(false);
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Archive Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is irreversible. All team data, projects, presets, and member access will be permanently
              deleted. Type the team name to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder={`Type "${team.name}" to confirm`}
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onDeleteTeam();
                setShowDeleteDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Team Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
