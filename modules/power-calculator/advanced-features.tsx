import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, Plus, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import {
  calculateHarmonicDistortion,
  calculateInrushCurrent,
} from "@/lib/power-calculations";
import { Device } from "./device-table";
import { getEquipmentById } from "@/lib/equipment-library";

interface AdvancedFeaturesProps {
  devices: Device[];
}

export function AdvancedFeatures({ devices }: AdvancedFeaturesProps) {
  const [fundamentalCurrent, setFundamentalCurrent] = useState(100);
  const [harmonics, setHarmonics] = useState<number[]>([0, 0, 0, 0, 0]);

  const harmonicCalc = useMemo(() => {
    return calculateHarmonicDistortion(fundamentalCurrent, harmonics);
  }, [fundamentalCurrent, harmonics]);

  const inrushAnalysis = useMemo(() => {
    return devices.map((device) => {
      const equipmentId = device.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      const equipment = getEquipmentById(equipmentId);

      const inrushType = equipment?.inrushType || "LED";
      const steadyStateCurrent = device.powerRating / (device.voltage * device.powerFactor);

      const inrush = calculateInrushCurrent(steadyStateCurrent, inrushType);

      return {
        device,
        steadyStateCurrent,
        inrushCurrent: inrush.inrushCurrent,
        peakMultiplier: inrush.peakMultiplier,
        duration: inrush.duration,
        inrushType,
      };
    });
  }, [devices]);

  const totalInrushCurrent = inrushAnalysis.reduce(
    (sum, item) => sum + item.inrushCurrent * item.device.quantity,
    0
  );

  const totalSteadyStateCurrent = inrushAnalysis.reduce(
    (sum, item) => sum + item.steadyStateCurrent * item.device.quantity,
    0
  );

  const updateHarmonic = (index: number, value: number) => {
    const newHarmonics = [...harmonics];
    newHarmonics[index] = value;
    setHarmonics(newHarmonics);
  };

  const addHarmonic = () => {
    setHarmonics([...harmonics, 0]);
  };

  const removeHarmonic = (index: number) => {
    setHarmonics(harmonics.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Advanced Analysis</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Harmonic Distortion (THD)</h4>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fundamental" className="text-gray-300">
                Fundamental Current (A)
              </Label>
              <Input
                id="fundamental"
                type="number"
                min="0"
                value={fundamentalCurrent}
                onChange={(e) => setFundamentalCurrent(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Harmonic Components</Label>
                <Button variant="outline" size="sm" onClick={addHarmonic}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>

              {harmonics.map((harmonic, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 w-16">H{index + 3}</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={harmonic}
                    onChange={(e) => updateHarmonic(index, parseFloat(e.target.value) || 0)}
                    placeholder="Current (A)"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHarmonic(index)}
                    disabled={harmonics.length <= 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-lg border border-cyan-500/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">THD</span>
                  <span
                    className={`text-2xl font-bold ${
                      harmonicCalc.thd > 50
                        ? "text-red-400"
                        : harmonicCalc.thd > 30
                        ? "text-amber-400"
                        : "text-green-400"
                    }`}
                  >
                    {harmonicCalc.thd.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Total RMS Current</span>
                  <span className="text-lg font-mono text-white">
                    {harmonicCalc.rms.toFixed(2)} A
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Derating Factor</span>
                  <span className="text-lg font-mono text-cyan-300">
                    {harmonicCalc.derateFactor.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {harmonicCalc.thd > 30 && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-200 text-xs">
                  High THD can cause neutral conductor overheating. Use K-rated transformers
                  and oversized neutrals for non-linear loads.
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>THD Guidelines:</p>
              <p>• &lt;15%: Excellent (minimal effect)</p>
              <p>• 15-30%: Good (manageable with proper sizing)</p>
              <p>• 30-50%: Fair (requires derating and mitigation)</p>
              <p>• &gt;50%: Poor (significant issues, filter recommended)</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Inrush Current Analysis</h4>

          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-violet-500/10 to-magenta-500/10 rounded-lg border border-violet-500/20">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Peak Inrush</span>
                  <span className="text-2xl font-bold gradient-text">
                    {totalInrushCurrent.toFixed(0)} A
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Steady State</span>
                  <span className="text-lg font-mono text-white">
                    {totalSteadyStateCurrent.toFixed(1)} A
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Peak Multiplier</span>
                  <span className="text-lg font-mono text-cyan-300">
                    {(totalInrushCurrent / totalSteadyStateCurrent).toFixed(1)}×
                  </span>
                </div>
              </div>
            </div>

            {totalInrushCurrent / totalSteadyStateCurrent > 10 && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-200 text-xs">
                  High inrush current may trip breakers. Consider soft-start devices or
                  sequential power-up.
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {inrushAnalysis.slice(0, 10).map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">
                      {item.device.name || "Unnamed"}
                    </span>
                    <span className="text-cyan-300 font-mono">
                      {item.peakMultiplier.toFixed(0)}× peak
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>
                      {item.device.quantity}× {item.inrushType}
                    </span>
                    <span className="font-mono">
                      {item.steadyStateCurrent.toFixed(1)}A → {item.inrushCurrent.toFixed(0)}A
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>Inrush by Equipment Type:</p>
              <p>• LED: 2× (fast, minimal impact)</p>
              <p>• Incandescent: 10× (cold filament)</p>
              <p>• Motor: 6× (starting torque)</p>
              <p>• Transformer: 8× (magnetic saturation)</p>
              <p>• Capacitive: 20× (charging current)</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h4 className="text-sm font-semibold text-white mb-4">Power Quality Recommendations</h4>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="text-cyan-300 font-semibold mb-2">For High THD Loads</h5>
            <ul className="text-gray-400 space-y-1">
              <li>• Use K-rated transformers (K-13 or K-20 for LED/switching loads)</li>
              <li>• Oversize neutral conductors by 1.73× for 3rd harmonic</li>
              <li>• Install harmonic filters at main distribution</li>
              <li>• Monitor neutral-to-ground voltage (&lt;2V acceptable)</li>
              <li>• Consider active harmonic mitigation for THD &gt;40%</li>
            </ul>
          </div>

          <div>
            <h5 className="text-cyan-300 font-semibold mb-2">For High Inrush Currents</h5>
            <ul className="text-gray-400 space-y-1">
              <li>• Use Type D or K curve breakers for motor/transformer loads</li>
              <li>• Implement soft-start controllers for large motors</li>
              <li>• Power up equipment sequentially, not simultaneously</li>
              <li>• Size breakers for inrush, not just steady-state current</li>
              <li>• Add inrush limiting thermistors for capacitive loads</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
