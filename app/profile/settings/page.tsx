"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function SettingsContent() {
  const { user, profile, refreshProfile } = useAuth();
  const [units, setUnits] = useState(profile?.settings?.units || "metric");
  const [theme, setTheme] = useState(profile?.settings?.theme || "dark");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSaveSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setSuccess(false);

      await dbService.updateProfile(user.id, {
        settings: {
          units,
          theme,
        },
      });

      await refreshProfile();
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 px-4 pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/profile" className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="text-4xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-gray-400">Customize your experience</p>
        </div>

        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            Settings saved successfully!
          </div>
        )}

        <div className="space-y-6">
          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Measurement Units</CardTitle>
              <CardDescription>Choose your preferred unit system for calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={units} onValueChange={setUnits}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metric" id="metric" />
                  <Label htmlFor="metric" className="cursor-pointer">
                    Metric (meters, kilograms, celsius)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imperial" id="imperial" />
                  <Label htmlFor="imperial" className="cursor-pointer">
                    Imperial (feet, pounds, fahrenheit)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="glass-panel border-white/10">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Application theme preference</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="cursor-pointer">
                    Dark (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="light" id="light" disabled />
                  <Label htmlFor="light" className="cursor-pointer">
                    Light (Coming Soon)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Button onClick={handleSaveSettings} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
