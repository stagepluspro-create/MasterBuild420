"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Lock, Edit, Trash2, Plus, CheckCircle } from "lucide-react";

interface Permission {
  key: string;
  label: string;
  description: string;
  category: string;
}

interface RolePermissions {
  [key: string]: boolean;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Dashboard
  { key: "view_dashboard", label: "View Dashboard", description: "Access team dashboard", category: "Dashboard" },
  { key: "view_analytics", label: "View Analytics", description: "Access team analytics and reports", category: "Dashboard" },

  // Projects
  { key: "view_projects", label: "View Projects", description: "View team projects", category: "Projects" },
  { key: "create_projects", label: "Create Projects", description: "Create new projects", category: "Projects" },
  { key: "edit_projects", label: "Edit Projects", description: "Edit project details", category: "Projects" },
  { key: "delete_projects", label: "Delete Projects", description: "Delete projects", category: "Projects" },

  // Tools
  { key: "use_tools", label: "Use Tools", description: "Access and use platform tools", category: "Tools" },
  { key: "manage_tool_access", label: "Manage Tool Access", description: "Control tool access for members", category: "Tools" },

  // Team Management
  { key: "invite_members", label: "Invite Members", description: "Invite new team members", category: "Team" },
  { key: "remove_members", label: "Remove Members", description: "Remove team members", category: "Team" },
  { key: "manage_roles", label: "Manage Roles", description: "Change member roles and permissions", category: "Team" },
  { key: "view_members", label: "View Members", description: "View team member list", category: "Team" },

  // Settings
  { key: "edit_team_settings", label: "Edit Team Settings", description: "Modify team configuration", category: "Settings" },
  { key: "manage_integrations", label: "Manage Integrations", description: "Configure third-party integrations", category: "Settings" },
  { key: "view_security", label: "View Security Settings", description: "View security policies", category: "Settings" },
  { key: "edit_security", label: "Edit Security Settings", description: "Modify security policies", category: "Settings" },

  // Billing
  { key: "view_billing", label: "View Billing", description: "View subscription and billing info", category: "Billing" },
  { key: "manage_billing", label: "Manage Billing", description: "Modify subscription and payment methods", category: "Billing" },

  // API
  { key: "view_api_keys", label: "View API Keys", description: "View team API keys", category: "API" },
  { key: "create_api_keys", label: "Create API Keys", description: "Generate new API keys", category: "API" },
  { key: "revoke_api_keys", label: "Revoke API Keys", description: "Revoke existing API keys", category: "API" },
];

const PREDEFINED_ROLES = {
  owner: {
    name: "Owner",
    description: "Full control over team and all resources",
    permissions: Object.fromEntries(AVAILABLE_PERMISSIONS.map((p) => [p.key, true])),
    locked: true,
  },
  admin: {
    name: "Admin",
    description: "Manage team, members, and projects",
    permissions: {
      view_dashboard: true,
      view_analytics: true,
      view_projects: true,
      create_projects: true,
      edit_projects: true,
      delete_projects: true,
      use_tools: true,
      manage_tool_access: true,
      invite_members: true,
      remove_members: true,
      manage_roles: true,
      view_members: true,
      edit_team_settings: true,
      manage_integrations: true,
      view_security: true,
      view_billing: true,
      view_api_keys: true,
      create_api_keys: true,
    },
    locked: false,
  },
  member: {
    name: "Member",
    description: "Access tools and contribute to projects",
    permissions: {
      view_dashboard: true,
      view_projects: true,
      create_projects: true,
      edit_projects: true,
      use_tools: true,
      view_members: true,
    },
    locked: false,
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to team resources",
    permissions: {
      view_dashboard: true,
      view_projects: true,
      view_members: true,
    },
    locked: false,
  },
};

interface PermissionsMatrixProps {
  teamId: string;
  currentRole: string;
  onUpdatePermissions: (memberId: string, permissions: Record<string, boolean>) => Promise<void>;
}

export function PermissionsMatrix({ teamId, currentRole, onUpdatePermissions }: PermissionsMatrixProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleDescription, setCustomRoleDescription] = useState("");
  const [customPermissions, setCustomPermissions] = useState<Record<string, boolean>>({});
  const [selectedPreview, setSelectedPreview] = useState<string | null>("owner");

  const categories = Array.from(new Set(AVAILABLE_PERMISSIONS.map((p) => p.category)));

  const toggleCustomPermission = (key: string) => {
    setCustomPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const previewRole = selectedPreview
    ? PREDEFINED_ROLES[selectedPreview as keyof typeof PREDEFINED_ROLES]
    : null;

  return (
    <div className="space-y-6">
      {/* Predefined Roles Overview */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            Roles & Permissions
          </CardTitle>
          <CardDescription>
            Manage team member roles and their associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PREDEFINED_ROLES).map(([key, role]) => (
              <Card
                key={key}
                className={`glass-panel border-white/10 cursor-pointer hover:border-cyan-500/30 transition-colors ${
                  selectedPreview === key ? "border-cyan-500/50" : ""
                }`}
                onClick={() => setSelectedPreview(key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    {role.locked && <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                  <CardDescription className="text-xs">{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-400">
                    {Object.values(role.permissions).filter(Boolean).length}
                  </div>
                  <p className="text-xs text-gray-500">permissions enabled</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={() => setCustomDialogOpen(true)} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Role
          </Button>
        </CardContent>
      </Card>

      {/* Permissions Preview */}
      {previewRole && (
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{previewRole.name} Permissions</CardTitle>
                <CardDescription>{previewRole.description}</CardDescription>
              </div>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/50">
                {Object.values(previewRole.permissions).filter(Boolean).length} Permissions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryPermissions = AVAILABLE_PERMISSIONS.filter((p) => p.category === category);
                const permissions = previewRole.permissions as RolePermissions;
                const enabledCount = categoryPermissions.filter(
                  (p) => permissions[p.key]
                ).length;

                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{category}</h4>
                      <span className="text-sm text-gray-400">
                        {enabledCount}/{categoryPermissions.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((permission) => {
                        const permissions = previewRole.permissions as RolePermissions;
                        const enabled = permissions[permission.key];
                        return (
                          <div
                            key={permission.key}
                            className={`p-3 rounded-lg border ${
                              enabled
                                ? "bg-cyan-500/10 border-cyan-500/30"
                                : "bg-white/5 border-white/10"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Label className="text-sm font-medium text-white cursor-pointer">
                                    {permission.label}
                                  </Label>
                                  {enabled && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                                </div>
                                <p className="text-xs text-gray-400">{permission.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Role Creation Dialog */}
      <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions for your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g., Production Manager"
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the responsibilities of this role..."
                value={customRoleDescription}
                onChange={(e) => setCustomRoleDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base">Permissions</Label>
              {categories.map((category) => {
                const categoryPermissions = AVAILABLE_PERMISSIONS.filter((p) => p.category === category);
                const enabledCount = categoryPermissions.filter(
                  (p) => customPermissions[p.key]
                ).length;

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{category}</h4>
                      <span className="text-sm text-gray-400">
                        {enabledCount}/{categoryPermissions.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map((permission) => (
                        <div
                          key={permission.key}
                          className="flex items-start justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="flex-1">
                            <Label
                              htmlFor={`perm-${permission.key}`}
                              className="text-sm font-medium text-white cursor-pointer"
                            >
                              {permission.label}
                            </Label>
                            <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                          </div>
                          <Switch
                            id={`perm-${permission.key}`}
                            checked={customPermissions[permission.key] || false}
                            onCheckedChange={() => toggleCustomPermission(permission.key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement custom role creation
                setCustomDialogOpen(false);
                setCustomRoleName("");
                setCustomRoleDescription("");
                setCustomPermissions({});
              }}
              disabled={!customRoleName.trim()}
            >
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
