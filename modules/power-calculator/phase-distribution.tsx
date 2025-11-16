import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Zap, TrendingUp } from "lucide-react";
import { Device } from "./device-table";
import { balancePhases, calculateCurrent } from "@/lib/power-calculations";

interface PhaseDistributionProps {
  devices: Device[];
  voltage: number;
  onDevicesChange: (devices: Device[]) => void;
}

export function PhaseDistribution({
  devices,
  voltage,
  onDevicesChange,
}: PhaseDistributionProps) {
  const phaseLoads = useMemo(() => {
    const loads = { A: 0, B: 0, C: 0 };

    devices.forEach((device) => {
      const totalPower = device.powerRating * device.quantity;
      if (device.phase === "A") loads.A += totalPower;
      else if (device.phase === "B") loads.B += totalPower;
      else if (device.phase === "C") loads.C += totalPower;
    });

    return loads;
  }, [devices]);

  const phaseCurrents = useMemo(() => {
    return {
      A: phaseLoads.A / (voltage * 0.9),
      B: phaseLoads.B / (voltage * 0.9),
      C: phaseLoads.C / (voltage * 0.9),
    };
  }, [phaseLoads, voltage]);

  const totalLoad = phaseLoads.A + phaseLoads.B + phaseLoads.C;
  const avgLoad = totalLoad / 3;

  const imbalance = useMemo(() => {
    if (avgLoad === 0) return 0;
    const maxDeviation = Math.max(
      Math.abs(phaseLoads.A - avgLoad),
      Math.abs(phaseLoads.B - avgLoad),
      Math.abs(phaseLoads.C - avgLoad)
    );
    return (maxDeviation / avgLoad) * 100;
  }, [phaseLoads, avgLoad]);

  const autoBalance = () => {
    const deviceList = devices.map((d) => ({
      power: d.powerRating * d.quantity,
      id: d.id,
    }));

    const balanced = balancePhases(deviceList);

    const updatedDevices = devices.map((device) => {
      let newPhase: "A" | "B" | "C" = device.phase as any;
      if (balanced.phaseA.includes(device.id)) newPhase = "A";
      else if (balanced.phaseB.includes(device.id)) newPhase = "B";
      else if (balanced.phaseC.includes(device.id)) newPhase = "C";

      return { ...device, phase: newPhase };
    });

    onDevicesChange(updatedDevices);
  };

  const getPhaseColor = (load: number) => {
    const percent = (load / avgLoad) * 100;
    if (percent > 120) return "bg-red-500";
    if (percent > 110) return "bg-amber-500";
    return "bg-cyan-500";
  };

  const maxLoad = Math.max(phaseLoads.A, phaseLoads.B, phaseLoads.C);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Phase Distribution</h3>
        <Button variant="outline" size="sm" onClick={autoBalance}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Auto Balance
        </Button>
      </div>

      {imbalance > 20 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            Phase imbalance is {imbalance.toFixed(1)}%. Consider redistributing loads
            to balance phases within 20%.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {(["A", "B", "C"] as const).map((phase) => {
          const load = phaseLoads[phase];
          const current = phaseCurrents[phase];
          const percent = maxLoad > 0 ? (load / maxLoad) * 100 : 0;
          const loadPercent = avgLoad > 0 ? (load / avgLoad) * 100 : 0;

          return (
            <Card key={phase} className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-cyan-400" />
                  <h4 className="text-lg font-bold text-white">Phase {phase}</h4>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    loadPercent > 120
                      ? "bg-red-500/20 text-red-300"
                      : loadPercent > 110
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-cyan-500/20 text-cyan-300"
                  }`}
                >
                  {loadPercent.toFixed(0)}%
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Power</span>
                    <span className="text-white font-medium">
                      {(load / 1000).toFixed(2)} kW
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getPhaseColor(load)}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Current</span>
                  <span className="text-cyan-300 font-medium">
                    {current.toFixed(1)} A
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Devices</span>
                  <span className="text-gray-300">
                    {devices.filter((d) => d.phase === phase).length}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Load</p>
            <p className="text-2xl font-bold gradient-text">
              {(totalLoad / 1000).toFixed(2)} kW
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Avg Per Phase</p>
            <p className="text-2xl font-bold text-white">
              {(avgLoad / 1000).toFixed(2)} kW
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Imbalance</p>
            <p
              className={`text-2xl font-bold ${
                imbalance > 20
                  ? "text-amber-400"
                  : imbalance > 10
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {imbalance.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">Phase Load Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Line-to-Line Voltage:</span>
            <span className="text-white font-mono">{voltage}V</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Line-to-Neutral Voltage:</span>
            <span className="text-white font-mono">{(voltage / Math.sqrt(3)).toFixed(1)}V</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total 3-Phase Current:</span>
            <span className="text-cyan-300 font-mono">
              {(phaseCurrents.A + phaseCurrents.B + phaseCurrents.C).toFixed(1)} A
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
