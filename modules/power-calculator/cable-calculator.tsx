import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cable, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  calculateVoltageDrop,
  recommendCable,
  CABLE_SPECS,
  calculateDeratingFactor,
} from "@/lib/power-calculations";

interface CableCalculatorProps {
  voltage: number;
  phases: 1 | 3;
}

export function CableCalculator({ voltage, phases }: CableCalculatorProps) {
  const [current, setCurrent] = useState(20);
  const [length, setLength] = useState(30);
  const [ambientTemp, setAmbientTemp] = useState(30);
  const [bundledCables, setBundledCables] = useState(1);
  const [insulationType, setInsulationType] = useState<"THHN" | "THWN" | "XHHW">("THHN");

  const recommendation = useMemo(() => {
    return recommendCable(current, length, voltage, phases);
  }, [current, length, voltage, phases]);

  const voltageDrop = useMemo(() => {
    if (!recommendation) return null;
    return calculateVoltageDrop(current, length, recommendation.resistance, voltage, phases);
  }, [current, length, voltage, phases, recommendation]);

  const deratingFactor = useMemo(() => {
    return calculateDeratingFactor(ambientTemp, bundledCables, insulationType);
  }, [ambientTemp, bundledCables, insulationType]);

  const adjustedCurrent = current / deratingFactor;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Cable className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Cable Sizing & Voltage Drop</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Cable Parameters</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current" className="text-gray-300">Load Current (A)</Label>
              <Input
                id="current"
                type="number"
                min="0"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="length" className="text-gray-300">Cable Length (m)</Label>
              <Input
                id="length"
                type="number"
                min="0"
                value={length}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">One-way distance</p>
            </div>

            <div>
              <Label htmlFor="temp" className="text-gray-300">Ambient Temperature (°C)</Label>
              <Input
                id="temp"
                type="number"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 30)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="bundled" className="text-gray-300">Bundled Cables</Label>
              <Select
                value={bundledCables.toString()}
                onValueChange={(v) => setBundledCables(parseInt(v))}
              >
                <SelectTrigger id="bundled">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (No bundling)</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="insulation" className="text-gray-300">Insulation Type</Label>
              <Select value={insulationType} onValueChange={(v: any) => setInsulationType(v)}>
                <SelectTrigger id="insulation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THHN">THHN (90°C)</SelectItem>
                  <SelectItem value="THWN">THWN (75°C)</SelectItem>
                  <SelectItem value="XHHW">XHHW (90°C Dry)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Recommendations</h4>

          {recommendation && voltageDrop && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-lg border border-cyan-500/20">
                <p className="text-sm text-gray-400 mb-2">Recommended Cable Size</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold gradient-text">{recommendation.awg} AWG</p>
                  <p className="text-xl text-gray-300">({recommendation.mm2} mm²)</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Max current: {recommendation.maxCurrent}A
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Voltage Drop</span>
                  <span className={`font-bold ${voltageDrop.isExcessive ? "text-red-400" : "text-green-400"}`}>
                    {voltageDrop.voltageDrop.toFixed(2)}V ({voltageDrop.voltageDropPercent.toFixed(2)}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Voltage at Load</span>
                  <span className="font-mono text-white">
                    {voltageDrop.voltageAtLoad.toFixed(1)}V
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Cable Resistance</span>
                  <span className="font-mono text-cyan-300">
                    {recommendation.resistance} Ω/km
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Derating Factor</span>
                  <span className="font-mono text-white">
                    {deratingFactor.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-sm text-gray-400">Adjusted Current</span>
                  <span className="font-mono text-white">
                    {adjustedCurrent.toFixed(1)}A
                  </span>
                </div>
              </div>

              {voltageDrop.isExcessive ? (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-200">
                    Voltage drop exceeds 3% limit. Consider larger cable or shorter run.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-200">
                    Voltage drop is within acceptable limits (&lt;3%).
                  </AlertDescription>
                </Alert>
              )}

              {adjustedCurrent > recommendation.maxCurrent && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-200">
                    After derating, current exceeds cable capacity. Select larger cable.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h4 className="text-sm font-semibold text-white mb-4">Cable Size Reference Chart</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 pb-2 px-2">AWG</th>
                <th className="text-left text-gray-400 pb-2 px-2">mm²</th>
                <th className="text-left text-gray-400 pb-2 px-2">Max Current (A)</th>
                <th className="text-left text-gray-400 pb-2 px-2">Resistance (Ω/km)</th>
              </tr>
            </thead>
            <tbody>
              {CABLE_SPECS.slice(0, 10).map((cable) => (
                <tr
                  key={cable.awg}
                  className={`border-b border-white/5 ${
                    recommendation?.awg === cable.awg ? "bg-cyan-500/10" : ""
                  }`}
                >
                  <td className="py-2 px-2 font-mono text-white">{cable.awg}</td>
                  <td className="py-2 px-2 text-gray-300">{cable.mm2}</td>
                  <td className="py-2 px-2 text-cyan-300">{cable.maxCurrent}</td>
                  <td className="py-2 px-2 text-gray-400">{cable.resistance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
