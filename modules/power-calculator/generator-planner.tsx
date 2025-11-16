import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Fuel, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { calculateGeneratorSize } from "@/lib/power-calculations";

interface GeneratorPlannerProps {
  totalPowerKW: number;
  averagePowerFactor: number;
}

export function GeneratorPlanner({ totalPowerKW, averagePowerFactor }: GeneratorPlannerProps) {
  const [safetyMargin, setSafetyMargin] = useState(25);
  const [runtimeHours, setRuntimeHours] = useState(4);
  const [loadFactor, setLoadFactor] = useState(75);

  const generatorCalc = useMemo(() => {
    return calculateGeneratorSize(totalPowerKW, averagePowerFactor, safetyMargin / 100);
  }, [totalPowerKW, averagePowerFactor, safetyMargin]);

  const fuelRequired = useMemo(() => {
    const actualLoad = (generatorCalc.recommendedKVA * loadFactor) / 100;
    const fuelPerHour = actualLoad * 0.25;
    return fuelPerHour * runtimeHours;
  }, [generatorCalc.recommendedKVA, loadFactor, runtimeHours]);

  const commonGenerators = [
    { name: "20 kVA", kva: 20, kw: 16 },
    { name: "30 kVA", kva: 30, kw: 24 },
    { name: "45 kVA", kva: 45, kw: 36 },
    { name: "60 kVA", kva: 60, kw: 48 },
    { name: "80 kVA", kva: 80, kw: 64 },
    { name: "100 kVA", kva: 100, kw: 80 },
    { name: "125 kVA", kva: 125, kw: 100 },
    { name: "150 kVA", kva: 150, kw: 120 },
    { name: "200 kVA", kva: 200, kw: 160 },
    { name: "250 kVA", kva: 250, kw: 200 },
  ];

  const suitableGenerators = commonGenerators.filter(
    (gen) => gen.kva >= generatorCalc.recommendedKVA
  );

  const recommendedGen = suitableGenerators[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Fuel className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Generator Sizing</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Load Requirements</h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm text-gray-400">Real Power (kW)</span>
              <span className="text-xl font-bold text-white">
                {generatorCalc.kW.toFixed(2)} kW
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm text-gray-400">Apparent Power (kVA)</span>
              <span className="text-xl font-bold gradient-text">
                {generatorCalc.kVA.toFixed(2)} kVA
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-sm text-gray-400">Power Factor</span>
              <span className="text-xl font-mono text-cyan-300">
                {averagePowerFactor.toFixed(2)}
              </span>
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">
                Safety Margin: {safetyMargin}%
              </Label>
              <Slider
                value={[safetyMargin]}
                onValueChange={(v) => setSafetyMargin(v[0])}
                min={10}
                max={50}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Industry standard: 25% for general use, 40% for motor loads
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-sm text-gray-400 mb-1">Recommended Generator Size</p>
              <p className="text-3xl font-bold gradient-text">
                {generatorCalc.recommendedKVA.toFixed(0)} kVA
              </p>
              <p className="text-sm text-gray-400 mt-1">
                ({(generatorCalc.recommendedKVA * averagePowerFactor).toFixed(0)} kW @ PF {averagePowerFactor})
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <h4 className="text-sm font-semibold text-white mb-4">Fuel Planning</h4>

          <div className="space-y-4">
            <div>
              <Label htmlFor="runtime" className="text-gray-300 mb-2 block">
                Runtime (hours)
              </Label>
              <Input
                id="runtime"
                type="number"
                min="0"
                value={runtimeHours}
                onChange={(e) => setRuntimeHours(parseFloat(e.target.value) || 1)}
              />
            </div>

            <div>
              <Label className="text-gray-300 mb-2 block">
                Average Load: {loadFactor}%
              </Label>
              <Slider
                value={[loadFactor]}
                onValueChange={(v) => setLoadFactor(v[0])}
                min={25}
                max={100}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Typical show load: 60-80% of generator capacity
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Fuel per Hour</span>
                <span className="text-lg font-mono text-cyan-300">
                  {generatorCalc.fuelConsumptionLH.toFixed(1)} L/h
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Total Fuel Required</span>
                <span className="text-lg font-mono text-white">
                  {fuelRequired.toFixed(1)} L
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <span className="text-sm text-gray-400">Gallons (US)</span>
                <span className="text-lg font-mono text-gray-300">
                  {(fuelRequired / 3.785).toFixed(1)} gal
                </span>
              </div>
            </div>

            <Alert className="border-cyan-500/50 bg-cyan-500/10">
              <Zap className="h-4 w-4 text-cyan-500" />
              <AlertDescription className="text-cyan-200 text-xs">
                Add 20% buffer for fuel calculation to account for variations in load.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h4 className="text-sm font-semibold text-white mb-4">Generator Recommendations</h4>

        {recommendedGen ? (
          <div className="space-y-3">
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-200">
                Recommended: <strong>{recommendedGen.name}</strong> generator ({recommendedGen.kw} kW / {recommendedGen.kva} kVA)
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {suitableGenerators.slice(0, 5).map((gen) => {
                const loadPercent = (generatorCalc.recommendedKVA / gen.kva) * 100;
                const isRecommended = gen.name === recommendedGen.name;

                return (
                  <div
                    key={gen.name}
                    className={`p-3 rounded-lg border ${
                      isRecommended
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white mb-1">{gen.name}</p>
                    <p className="text-xs text-gray-400 mb-2">
                      {gen.kw} kW / {gen.kva} kVA
                    </p>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          loadPercent > 90
                            ? "bg-red-500"
                            : loadPercent > 75
                            ? "bg-amber-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(loadPercent, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{loadPercent.toFixed(0)}% load</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">
              Required generator size ({generatorCalc.recommendedKVA.toFixed(0)} kVA) exceeds common
              portable generators. Consider multiple units or large trailer-mounted generators.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <h5 className="text-xs font-semibold text-white mb-2">Generator Selection Tips</h5>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Choose 3-phase generators for balanced loads and efficiency</li>
            <li>• Ensure generator voltage matches your distribution system</li>
            <li>• Verify connector types (Camlock, Powerlock, etc.)</li>
            <li>• Consider noise levels for indoor or audience-adjacent placement</li>
            <li>• Plan for grounding and bonding per local electrical codes</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
