import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { Device } from "./device-table";
import { recommendBreaker, BREAKER_SIZES } from "@/lib/power-calculations";

interface BreakerCircuitProps {
  devices: Device[];
  voltage: number;
  phases: 1 | 3;
}

interface CircuitGroup {
  name: string;
  devices: Device[];
  totalCurrent: number;
  breaker: ReturnType<typeof recommendBreaker>;
}

export function BreakerCircuit({ devices, voltage, phases }: BreakerCircuitProps) {
  const circuits = useMemo(() => {
    const circuitMap = new Map<string, Device[]>();

    devices.forEach((device) => {
      const circuitName = device.circuit || "Unassigned";
      if (!circuitMap.has(circuitName)) {
        circuitMap.set(circuitName, []);
      }
      circuitMap.get(circuitName)!.push(device);
    });

    const circuitGroups: CircuitGroup[] = [];

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

      circuitGroups.push({
        name: circuitName,
        devices: devicesInCircuit,
        totalCurrent,
        breaker,
      });
    });

    return circuitGroups.sort((a, b) => b.totalCurrent - a.totalCurrent);
  }, [devices, voltage, phases]);

  const totalBreakersNeeded = circuits.filter((c) => c.name !== "Unassigned").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Circuit Breaker Planning</h3>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <p className="text-sm text-gray-400 mb-1">Total Circuits</p>
          <p className="text-2xl font-bold text-white">{totalBreakersNeeded}</p>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-sm text-gray-400 mb-1">Devices Assigned</p>
          <p className="text-2xl font-bold gradient-text">
            {devices.filter((d) => d.circuit && d.circuit !== "").length}
          </p>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <p className="text-sm text-gray-400 mb-1">Unassigned Devices</p>
          <p className="text-2xl font-bold text-amber-400">
            {devices.filter((d) => !d.circuit || d.circuit === "").length}
          </p>
        </Card>
      </div>

      {circuits.some((c) => c.name === "Unassigned") && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            Some devices are not assigned to a circuit. Assign circuits in the device table.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {circuits.map((circuit) => {
          const isSafe = circuit.breaker.isSafe;
          const isUnassigned = circuit.name === "Unassigned";

          return (
            <Card
              key={circuit.name}
              className={`p-4 border ${
                isUnassigned
                  ? "bg-gray-500/5 border-gray-500/20"
                  : isSafe
                  ? "bg-white/5 border-white/10"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-semibold text-white">{circuit.name}</h4>
                    {isSafe ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {circuit.devices.length} device{circuit.devices.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold gradient-text">
                    {circuit.breaker.size}A
                  </p>
                  <p className="text-xs text-gray-400">{circuit.breaker.type}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Load Current</p>
                  <p className="text-lg font-mono text-cyan-300">
                    {circuit.totalCurrent.toFixed(1)}A
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Breaker Load</p>
                  <p className="text-lg font-mono text-white">
                    {circuit.breaker.loadPercent.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Available Capacity</p>
                  <p className="text-lg font-mono text-green-400">
                    {(circuit.breaker.size - circuit.totalCurrent).toFixed(1)}A
                  </p>
                </div>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all ${
                    circuit.breaker.loadPercent > 80
                      ? "bg-red-500"
                      : circuit.breaker.loadPercent > 70
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                  }`}
                  style={{ width: `${Math.min(circuit.breaker.loadPercent, 100)}%` }}
                />
              </div>

              {!isSafe && !isUnassigned && (
                <Alert className="border-red-500/50 bg-red-500/10 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-200 text-xs">
                    Load exceeds 80% continuous rating. Reduce load or increase breaker size.
                  </AlertDescription>
                </Alert>
              )}

              <details className="text-xs">
                <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                  Show devices ({circuit.devices.length})
                </summary>
                <div className="mt-2 space-y-1 pl-4">
                  {circuit.devices.map((device, idx) => (
                    <div key={idx} className="flex items-center justify-between text-gray-400">
                      <span>
                        {device.quantity}× {device.name || "Unnamed Device"}
                      </span>
                      <span className="font-mono">
                        {(device.powerRating * device.quantity).toFixed(0)}W
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h4 className="text-sm font-semibold text-white mb-4">Standard Breaker Sizes</h4>
        <div className="flex flex-wrap gap-2">
          {BREAKER_SIZES.slice(0, 16).map((size) => (
            <div
              key={size}
              className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-300 text-sm font-mono"
            >
              {size}A
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Continuous load should not exceed 80% of breaker rating per NEC guidelines.
        </p>
      </Card>
    </div>
  );
}
