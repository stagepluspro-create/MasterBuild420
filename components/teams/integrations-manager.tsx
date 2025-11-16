"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Link, Unlink, Settings, CheckCircle, XCircle, AlertCircle, Cloud } from "lucide-react";
import { TeamIntegration } from "@/lib/team-service";

interface IntegrationsManagerProps {
  teamId: string;
  integrations: TeamIntegration[];
  onConnect: (type: string, name: string, config: Record<string, any>) => Promise<void>;
  onDisconnect: (integrationId: string) => Promise<void>;
  onConfigure: (integrationId: string, config: Record<string, any>) => Promise<void>;
}

const AVAILABLE_INTEGRATIONS = [
  {
    type: "storage",
    name: "Google Drive",
    description: "Sync files and documents with Google Drive",
    icon: Cloud,
    color: "text-blue-400",
    fields: [
      { key: "api_key", label: "API Key", type: "text", required: true },
      { key: "folder_id", label: "Folder ID", type: "text", required: false },
    ],
  },
  {
    type: "storage",
    name: "Dropbox",
    description: "Connect to Dropbox for file storage",
    icon: Cloud,
    color: "text-blue-500",
    fields: [
      { key: "access_token", label: "Access Token", type: "password", required: true },
    ],
  },
  {
    type: "communication",
    name: "Slack",
    description: "Send notifications to Slack channels",
    icon: Link,
    color: "text-purple-400",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", required: true },
      { key: "channel", label: "Channel", type: "text", required: false },
    ],
  },
  {
    type: "analytics",
    name: "Google Analytics",
    description: "Track team usage with Google Analytics",
    icon: CheckCircle,
    color: "text-orange-400",
    fields: [
      { key: "tracking_id", label: "Tracking ID", type: "text", required: true },
    ],
  },
];

export function IntegrationsManager({
  teamId,
  integrations,
  onConnect,
  onDisconnect,
  onConfigure,
}: IntegrationsManagerProps) {
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedIntegrationType, setSelectedIntegrationType] = useState<string>("");
  const [selectedIntegration, setSelectedIntegration] = useState<TeamIntegration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const selectedTemplate = AVAILABLE_INTEGRATIONS.find(
    (i) => i.type === selectedIntegrationType.split(":")[0] && i.name === selectedIntegrationType.split(":")[1]
  );

  const handleConnect = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      await onConnect(selectedTemplate.type, selectedTemplate.name, configValues);
      setConnectDialogOpen(false);
      setConfigValues({});
      setSelectedIntegrationType("");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    if (!selectedIntegration) return;

    setLoading(true);
    try {
      await onConfigure(selectedIntegration.id, configValues);
      setConfigDialogOpen(false);
      setSelectedIntegration(null);
      setConfigValues({});
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "disconnected":
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      case "disconnected":
        return <Badge variant="outline" className="text-gray-400">Disconnected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5 text-cyan-400" />
                Integrations
              </CardTitle>
              <CardDescription>Connect third-party services to your team</CardDescription>
            </div>
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((integration) => {
            const template = AVAILABLE_INTEGRATIONS.find(
              (i) => i.type === integration.integration_type && i.name === integration.integration_name
            );
            const Icon = template?.icon || Link;

            return (
              <Card key={integration.id} className="glass-panel border-white/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 bg-white/5 rounded ${template?.color || "text-gray-400"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.integration_name}</CardTitle>
                        <CardDescription className="text-sm">
                          {template?.description || "Custom integration"}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusIcon(integration.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getStatusBadge(integration.status)}
                    {integration.last_sync_at && (
                      <span className="text-xs text-gray-400">
                        Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedIntegration(integration);
                        setConfigValues(integration.config || {});
                        setConfigDialogOpen(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-400 border-red-400/50 hover:bg-red-400/10"
                      onClick={() => onDisconnect(integration.id)}
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Available Integrations */}
      {integrations.length === 0 && (
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12">
            <div className="text-center">
              <Cloud className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Integrations Connected</h3>
              <p className="text-gray-400 mb-6">Connect third-party services to enhance your team&apos;s workflow</p>
              <Button onClick={() => setConnectDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connect Integration Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect Integration</DialogTitle>
            <DialogDescription>
              Choose a service to connect and configure its settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Integration</label>
              <Select value={selectedIntegrationType} onValueChange={setSelectedIntegrationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an integration" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_INTEGRATIONS.map((integration) => (
                    <SelectItem key={`${integration.type}:${integration.name}`} value={`${integration.type}:${integration.name}`}>
                      {integration.name} - {integration.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-3">
                  <selectedTemplate.icon className={`w-8 h-8 ${selectedTemplate.color}`} />
                  <div>
                    <h4 className="font-semibold text-white">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                  </div>
                </div>

                {selectedTemplate.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <Input
                      type={field.type}
                      value={configValues[field.key] || ""}
                      onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConnect}
              disabled={
                loading ||
                !selectedTemplate ||
                selectedTemplate.fields.some((f) => f.required && !configValues[f.key])
              }
            >
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Integration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.integration_name}</DialogTitle>
            <DialogDescription>Update integration settings and credentials</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedIntegration &&
              AVAILABLE_INTEGRATIONS.find(
                (i) =>
                  i.type === selectedIntegration.integration_type &&
                  i.name === selectedIntegration.integration_name
              )?.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  <Input
                    type={field.type}
                    value={configValues[field.key] || ""}
                    onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigure} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
