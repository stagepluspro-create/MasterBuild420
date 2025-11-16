import { useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { Device } from "./device-table";
import {
  calculateCurrent,
  recommendBreaker,
  calculateVoltageDrop,
  recommendCable,
} from "@/lib/power-calculations";

interface SafetyAlertsProps {
  devices: Device[];
  voltage: number;
  phases: 1 | 3;
}

interface SafetyIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  affectedDevices?: string[];
}

export function SafetyAlerts({ devices, voltage, phases }: SafetyAlertsProps) {
  const issues = useMemo(() => {
    const alerts: SafetyIssue[] = [];

    if (phases === 3) {
      const phaseLoads = { A: 0, B: 0, C: 0 };
      devices.forEach((device) => {
        const totalPower = device.powerRating * device.quantity;
        if (device.phase === "A") phaseLoads.A += totalPower;
        else if (device.phase === "B") phaseLoads.B += totalPower;
        else if (device.phase === "C") phaseLoads.C += totalPower;
      });

      const totalLoad = phaseLoads.A + phaseLoads.B + phaseLoads.C;
      const avgLoad = totalLoad / 3;

      if (avgLoad > 0) {
        const maxDeviation = Math.max(
          Math.abs(phaseLoads.A - avgLoad),
          Math.abs(phaseLoads.B - avgLoad),
          Math.abs(phaseLoads.C - avgLoad)
        );
        const imbalance = (maxDeviation / avgLoad) * 100;

        if (imbalance > 30) {
          alerts.push({
            severity: "critical",
            category: "Phase Imbalance",
            message: `Phase imbalance is ${imbalance.toFixed(1)}%. Exceeds 30% limit. May cause overheating and inefficiency.`,
          });
        } else if (imbalance > 20) {
          alerts.push({
            severity: "warning",
            category: "Phase Imbalance",
            message: `Phase imbalance is ${imbalance.toFixed(1)}%. Consider rebalancing loads to stay under 20%.`,
          });
        }
      }
    }

    const circuitMap = new Map<string, Device[]>();
    devices.forEach((device) => {
      const circuitName = device.circuit || "";
      if (circuitName) {
        if (!circuitMap.has(circuitName)) {
          circuitMap.set(circuitName, []);
        }
        circuitMap.get(circuitName)!.push(device);
      }
    });

    circuitMap.forEach((devicesInCircuit, circuitName) => {
      const totalPower = devicesInCircuit.reduce(
        (sum, d) => sum + d.powerRating * d.quantity,
        0
      );
      const avgPF = devicesInCircuit.reduce((sum, d) => sum + d.powerFactor, 0) / devicesInCircuit.length;

      const totalCurrent =
        phases === 1
          ? totalPower / (voltage * avgPF)
          : totalPower / (Math.sqrt(3) * voltage * avgPF);

      const breaker = recommendBreaker(totalCurrent, true);

      if (!breaker.isSafe) {
        alerts.push({
          severity: "critical",
          category: "Circuit Overload",
          message: `Circuit "${circuitName}" load is ${breaker.loadPercent.toFixed(0)}%. Exceeds 80% continuous rating (${breaker.size}A breaker).`,
          affectedDevices: devicesInCircuit.map((d) => d.name),
        });
      } else if (breaker.loadPercent > 70) {
        alerts.push({
          severity: "warning",
          category: "Circuit Near Capacity",
          message: `Circuit "${circuitName}" is at ${breaker.loadPercent.toFixed(0)}% capacity. Consider margin for future expansion.`,
        });
      }
    });

    const unassignedDevices = devices.filter((d) => !d.circuit || d.circuit === "");
    if (unassignedDevices.length > 0) {
      alerts.push({
        severity: "warning",
        category: "Unassigned Circuits",
        message: `${unassignedDevices.length} device(s) not assigned to circuits. Assign circuits for proper distribution planning.`,
        affectedDevices: unassignedDevices.map((d) => d.name),
      });
    }

    devices.forEach((device) => {
      if (device.powerFactor < 0.7) {
        alerts.push({
          severity: "warning",
          category: "Low Power Factor",
          message: `"${device.name}" has PF of ${device.powerFactor}. May require power factor correction.`,
          affectedDevices: [device.name],
        });
      }

      if (device.voltage !== voltage && phases === 1) {
        alerts.push({
          severity: "critical",
          category: "Voltage Mismatch",
          message: `"${device.name}" rated for ${device.voltage}V but system is ${voltage}V. Requires transformer or voltage conversion.`,
          affectedDevices: [device.name],
        });
      }
    });

    const totalPower = devices.reduce((sum, d) => sum + d.powerRating * d.quantity, 0);
    if (totalPower > 100000) {
      alerts.push({
        severity: "info",
        category: "High Power Load",
        message: `Total system load is ${(totalPower / 1000).toFixed(1)} kW. Verify venue electrical capacity and permits.`,
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [devices, voltage, phases]);

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  const getIcon = (severity: SafetyIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertClass = (severity: SafetyIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "border-red-500/50 bg-red-500/10";
      case "warning":
        return "border-amber-500/50 bg-amber-500/10";
      case "info":
        return "border-cyan-500/50 bg-cyan-500/10";
    }
  };

  const getTextClass = (severity: SafetyIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-500";
      case "warning":
        return "text-amber-500";
      case "info":
        return "text-cyan-500";
    }
  };

  const getDescriptionClass = (severity: SafetyIssue["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-200";
      case "warning":
        return "text-amber-200";
      case "info":
        return "text-cyan-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card className={`p-4 ${criticalCount > 0 ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/10"}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Critical Issues</span>
            <span className={`text-2xl font-bold ${criticalCount > 0 ? "text-red-400" : "text-gray-600"}`}>
              {criticalCount}
            </span>
          </div>
        </Card>

        <Card className={`p-4 ${warningCount > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10"}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Warnings</span>
            <span className={`text-2xl font-bold ${warningCount > 0 ? "text-amber-400" : "text-gray-600"}`}>
              {warningCount}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Info</span>
            <span className="text-2xl font-bold text-cyan-400">{infoCount}</span>
          </div>
        </Card>
      </div>

      {issues.length === 0 ? (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-200">
            All safety checks passed. System appears properly configured within safe operating parameters.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {issues.map((issue, index) => (
            <Alert key={index} className={getAlertClass(issue.severity)}>
              <div className={getTextClass(issue.severity)}>{getIcon(issue.severity)}</div>
              <AlertDescription className="space-y-2">
                <div>
                  <span className={`font-semibold ${getTextClass(issue.severity)}`}>
                    {issue.category}:
                  </span>{" "}
                  <span className={getDescriptionClass(issue.severity)}>{issue.message}</span>
                </div>
                {issue.affectedDevices && issue.affectedDevices.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Affected: {issue.affectedDevices.slice(0, 3).join(", ")}
                    {issue.affectedDevices.length > 3 && ` and ${issue.affectedDevices.length - 3} more`}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Card className="p-6 bg-white/5 border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">Safety Guidelines</h4>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <h5 className="text-cyan-300 font-semibold mb-2">Before Power-Up</h5>
            <ul className="space-y-1">
              <li>• Verify all connections are tight and properly rated</li>
              <li>• Check ground/earth continuity on all equipment</li>
              <li>• Confirm breaker sizes match calculated requirements</li>
              <li>• Test with load bank before connecting show equipment</li>
              <li>• Have fire extinguisher (Class C) readily available</li>
            </ul>
          </div>
          <div>
            <h5 className="text-cyan-300 font-semibold mb-2">During Operation</h5>
            <ul className="space-y-1">
              <li>• Monitor cable temperatures (should be warm, not hot)</li>
              <li>• Check for neutral-to-ground voltage (&lt;2V acceptable)</li>
              <li>• Listen for buzzing from transformers (indicates harmonics)</li>
              <li>• Never exceed 80% of rated capacity continuously</li>
              <li>• Label and restrict access to electrical distribution</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
