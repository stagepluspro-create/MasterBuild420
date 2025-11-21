"use client";

import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { ConversionConflict } from "@/lib/console-translator/types";

interface ConflictsPanelProps {
  conflicts: ConversionConflict[];
}

export function ConflictsPanel({ conflicts }: ConflictsPanelProps) {
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const highConflicts = conflicts.filter(c => c.severity === 'high');
  const mediumConflicts = conflicts.filter(c => c.severity === 'medium');
  const lowConflicts = conflicts.filter(c => c.severity === 'low');

  const getIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="h-4 w-4" />;
    }
    if (severity === 'medium') {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Info className="h-4 w-4" />;
  };

  const getAlertVariant = (severity: string) => {
    if (severity === 'critical' || severity === 'high') return 'destructive';
    return 'default';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
        Validation Results
      </h3>

      <div className="space-y-3">
        {criticalConflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-red-400">
              Critical Issues ({criticalConflicts.length})
            </h4>
            {criticalConflicts.map((conflict, idx) => (
              <Alert key={idx} variant="destructive" className="py-3">
                <div className="flex gap-2">
                  {getIcon(conflict.severity)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-semibold mb-1">{conflict.message}</div>
                      {conflict.suggestedFix && (
                        <div className="text-xs text-gray-300 mt-1">
                          Fix: {conflict.suggestedFix}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {highConflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-orange-400">
              High Priority ({highConflicts.length})
            </h4>
            {highConflicts.slice(0, 5).map((conflict, idx) => (
              <Alert key={idx} className="py-3 border-orange-500/30">
                <div className="flex gap-2">
                  {getIcon(conflict.severity)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-semibold mb-1">{conflict.message}</div>
                      {conflict.suggestedFix && (
                        <div className="text-xs text-gray-300 mt-1">
                          Fix: {conflict.suggestedFix}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
            {highConflicts.length > 5 && (
              <div className="text-xs text-gray-400 text-center">
                ... and {highConflicts.length - 5} more high priority issues
              </div>
            )}
          </div>
        )}

        {mediumConflicts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-yellow-400">
              Medium Priority ({mediumConflicts.length})
            </h4>
            {mediumConflicts.slice(0, 3).map((conflict, idx) => (
              <Alert key={idx} className="py-3 border-yellow-500/30">
                <div className="flex gap-2">
                  {getIcon(conflict.severity)}
                  <div className="flex-1">
                    <AlertDescription className="text-sm">
                      {conflict.message}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
            {mediumConflicts.length > 3 && (
              <div className="text-xs text-gray-400 text-center">
                ... and {mediumConflicts.length - 3} more medium priority issues
              </div>
            )}
          </div>
        )}

        {lowConflicts.length > 0 && (
          <div className="text-sm text-gray-400">
            {lowConflicts.length} low priority notices
          </div>
        )}

        {conflicts.length === 0 && (
          <Alert className="border-green-500/30">
            <div className="flex gap-2 items-center text-green-400">
              <Info className="h-4 w-4" />
              <AlertDescription>
                No conflicts detected. Conversion appears clean.
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>
    </Card>
  );
}
