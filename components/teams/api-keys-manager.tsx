"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Key, Plus, Copy, Trash2, Shield, User, CheckCircle, AlertCircle } from "lucide-react";
import { TeamAPIKey, UserAPIKey } from "@/lib/team-service";

interface APIKeysManagerProps {
  teamId: string;
  currentUserId: string;
  teamAPIKeys: TeamAPIKey[];
  userAPIKeys: UserAPIKey[];
  canManageTeamKeys: boolean;
  onCreateTeamKey: (name: string, expiresInDays?: number) => Promise<{ key: string }>;
  onCreateUserKey: (name: string, expiresInDays?: number) => Promise<{ key: string }>;
  onRevokeTeamKey: (keyId: string) => Promise<void>;
  onRevokeUserKey: (keyId: string) => Promise<void>;
}

export function APIKeysManager({
  teamId,
  currentUserId,
  teamAPIKeys,
  userAPIKeys,
  canManageTeamKeys,
  onCreateTeamKey,
  onCreateUserKey,
  onRevokeTeamKey,
  onRevokeUserKey,
}: APIKeysManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyType, setKeyType] = useState<"team" | "user">("team");
  const [keyName, setKeyName] = useState("");
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [newKey, setNewKey] = useState<string>("");
  const [revokingKey, setRevokingKey] = useState<{ id: string; type: "team" | "user" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCreateKey = async () => {
    setLoading(true);
    try {
      const expiresInDays = expiresIn === "never" ? undefined : parseInt(expiresIn);
      const result = keyType === "team"
        ? await onCreateTeamKey(keyName, expiresInDays)
        : await onCreateUserKey(keyName, expiresInDays);

      setNewKey(result.key);
      setCreateDialogOpen(false);
      setShowKeyDialog(true);
      setKeyName("");
      setExpiresIn("never");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!revokingKey) return;

    setLoading(true);
    try {
      if (revokingKey.type === "team") {
        await onRevokeTeamKey(revokingKey.id);
      } else {
        await onRevokeUserKey(revokingKey.id);
      }
      setRevokeDialogOpen(false);
      setRevokingKey(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage team and personal API keys for programmatic access
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* API Keys Tabs */}
      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">
            <Shield className="w-4 h-4 mr-2" />
            Team Keys ({teamAPIKeys.length})
          </TabsTrigger>
          <TabsTrigger value="user">
            <User className="w-4 h-4 mr-2" />
            Personal Keys ({userAPIKeys.length})
          </TabsTrigger>
        </TabsList>

        {/* Team Keys */}
        <TabsContent value="team" className="space-y-4">
          {!canManageTeamKeys && (
            <Card className="glass-panel border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <p className="text-sm text-yellow-300">
                    You don&apos;t have permission to manage team API keys. Contact a team owner or admin.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {teamAPIKeys.length === 0 ? (
            <Card className="glass-panel border-white/10">
              <CardContent className="py-12 text-center">
                <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Team API Keys</h3>
                <p className="text-gray-400 mb-6">
                  Create a team API key to access your team&apos;s resources programmatically
                </p>
                {canManageTeamKeys && (
                  <Button onClick={() => {
                    setKeyType("team");
                    setCreateDialogOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team Key
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {teamAPIKeys.map((key) => (
                <Card key={key.id} className="glass-panel border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{key.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {key.key_prefix}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
                          {key.expires_at && (
                            <p className={new Date(key.expires_at) < new Date() ? "text-red-400" : ""}>
                              Expires: {new Date(key.expires_at).toLocaleDateString()}
                            </p>
                          )}
                          {key.last_used_at ? (
                            <p>Last used: {new Date(key.last_used_at).toLocaleString()}</p>
                          ) : (
                            <p className="text-gray-500">Never used</p>
                          )}
                        </div>
                      </div>

                      {canManageTeamKeys && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRevokingKey({ id: key.id, type: "team" });
                            setRevokeDialogOpen(true);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* User Keys */}
        <TabsContent value="user" className="space-y-4">
          {userAPIKeys.length === 0 ? (
            <Card className="glass-panel border-white/10">
              <CardContent className="py-12 text-center">
                <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Personal API Keys</h3>
                <p className="text-gray-400 mb-6">
                  Create a personal API key for individual access to team resources
                </p>
                <Button onClick={() => {
                  setKeyType("user");
                  setCreateDialogOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Personal Key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {userAPIKeys.map((key) => (
                <Card key={key.id} className="glass-panel border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{key.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {key.key_prefix}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-400">
                          <p>Created: {new Date(key.created_at).toLocaleDateString()}</p>
                          {key.expires_at && (
                            <p className={new Date(key.expires_at) < new Date() ? "text-red-400" : ""}>
                              Expires: {new Date(key.expires_at).toLocaleDateString()}
                            </p>
                          )}
                          {key.last_used_at ? (
                            <p>Last used: {new Date(key.last_used_at).toLocaleString()}</p>
                          ) : (
                            <p className="text-gray-500">Never used</p>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRevokingKey({ id: key.id, type: "user" });
                          setRevokeDialogOpen(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Type</label>
              <Select value={keyType} onValueChange={(v) => setKeyType(v as "team" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {canManageTeamKeys && (
                    <SelectItem value="team">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Team Key - Shared access for team resources
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Personal Key - Individual access
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Key Name</label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Production API"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expires In</label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                The key will only be shown once. Make sure to copy and store it securely.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey} disabled={loading || !keyName.trim()}>
              {loading ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              API Key Created Successfully
            </DialogTitle>
            <DialogDescription>
              Copy your API key now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-gray-400 mb-2">Your API Key:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-black/30 rounded text-sm text-cyan-400 break-all">
                  {newKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newKey)}
                >
                  {copiedKey ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-200 font-semibold mb-1">Important!</p>
              <p className="text-sm text-red-200">
                This is the only time you&apos;ll see this key. Store it securely and never share it.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setShowKeyDialog(false);
              setNewKey("");
            }}>
              I&apos;ve Saved My Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke the API key. Any applications using this key will lose access.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeKey}
              className="bg-red-500 hover:bg-red-600"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
