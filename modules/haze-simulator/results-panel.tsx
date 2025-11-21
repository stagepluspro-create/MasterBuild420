"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { SafetyWarning } from "@/lib/haze-simulator/types";

interface ResultsPanelProps {
  coverageScore: number;
  uniformityScore: number;
  elapsedTime: number;
  safetyWarnings: SafetyWarning[];
}

export function ResultsPanel({
  coverageScore,
  uniformityScore,
  elapsedTime,
  safetyWarnings
}: ResultsPanelProps) {
  const criticalWarnings = safetyWarnings.filter(w => w.severity === 'critical');
  const highWarnings = safetyWarnings.filter(w => w.severity === 'high');
  const mediumWarnings = safetyWarnings.filter(w => w.severity === 'medium');
  const lowWarnings = safetyWarnings.filter(w => w.severity === 'low');

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Coverage Score</span>
              <span className="text-sm font-semibold">{(coverageScore * 100).toFixed(1)}%</span>
            </div>
            <Progress value={coverageScore * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-400">Uniformity Score</span>
              <span className="text-sm font-semibold">{(uniformityScore * 100).toFixed(1)}%</span>
            </div>
            <Progress value={uniformityScore * 100} className="h-2" />
          </div>

          <div className="pt-2 border-t border-gray-700">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Elapsed Time</span>
              <span className="text-sm font-semibold">{elapsedTime.toFixed(1)}s</span>
            </div>
          </div>
        </div>
      </Card>

      {safetyWarnings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Safety Analysis
          </h3>

          <div className="space-y-2">
            {criticalWarnings.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-sm font-semibold text-red-400 mb-1">
                  Critical ({criticalWarnings.length})
                </div>
                {criticalWarnings.map((w, i) => (
                  <div key={i} className="text-xs text-gray-300">{w.message}</div>
                ))}
              </div>
            )}

            {highWarnings.length > 0 && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="text-sm font-semibold text-orange-400 mb-1">
                  High ({highWarnings.length})
                </div>
                {highWarnings.map((w, i) => (
                  <div key={i} className="text-xs text-gray-300">{w.message}</div>
                ))}
              </div>
            )}

            {mediumWarnings.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-sm font-semibold text-yellow-400 mb-1">
                  Medium ({mediumWarnings.length})
                </div>
                {mediumWarnings.map((w, i) => (
                  <div key={i} className="text-xs text-gray-300">{w.message}</div>
                ))}
              </div>
            )}

            {lowWarnings.length > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-sm font-semibold text-blue-400 mb-1">
                  Info ({lowWarnings.length})
                </div>
                {lowWarnings.map((w, i) => (
                  <div key={i} className="text-xs text-gray-300">{w.message}</div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {safetyWarnings.length === 0 && elapsedTime > 10 && (
        <Card className="p-6 border-green-500/30">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="h-5 w-5" />
            <div>
              <div className="font-semibold">All Clear</div>
              <div className="text-sm text-gray-400">No safety warnings detected</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
