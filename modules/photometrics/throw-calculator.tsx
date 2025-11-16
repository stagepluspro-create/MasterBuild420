"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface ThrowCalculatorProps {
  units: "metric" | "imperial";
  distance: number;
  setDistance: (value: number) => void;
  beamAngle: number;
  setBeamAngle: (value: number) => void;
  fieldAngle: number;
  setFieldAngle: (value: number) => void;
}

export function ThrowCalculator({
  units,
  distance,
  setDistance,
  beamAngle,
  setBeamAngle,
  fieldAngle,
  setFieldAngle,
}: ThrowCalculatorProps) {
  const distanceUnit = units === "metric" ? "m" : "ft";

  const beamDiameter = 2 * distance * Math.tan((beamAngle * Math.PI) / 360);
  const fieldDiameter = 2 * distance * Math.tan((fieldAngle * Math.PI) / 360);

  const calculateCoverage = (targetWidth: number, targetHeight: number, overlap: number) => {
    const effectiveDiameter = fieldDiameter * (1 - overlap / 100);
    const fixturesWide = Math.ceil(targetWidth / effectiveDiameter);
    const fixturesHigh = Math.ceil(targetHeight / effectiveDiameter);
    return { wide: fixturesWide, high: fixturesHigh, total: fixturesWide * fixturesHigh };
  };

  const coverage10x10 = calculateCoverage(10, 10, 10);
  const coverage20x10 = calculateCoverage(20, 10, 10);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Throw Distance ({distanceUnit})</Label>
          <Input
            type="number"
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
            min={0}
            step={units === "metric" ? 0.1 : 1}
          />
          <div className="flex gap-2 mt-2">
            {[5, 10, 15, 20].map((d) => (
              <button
                key={d}
                onClick={() => setDistance(units === "metric" ? d : d * 3.28)}
                className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded border border-white/10"
              >
                {units === "metric" ? d : Math.round(d * 3.28)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Beam Angle (°)</Label>
          <Input
            type="number"
            value={beamAngle}
            onChange={(e) => setBeamAngle(parseFloat(e.target.value) || 0)}
            min={1}
            max={180}
          />
          <p className="text-xs text-gray-400 mt-1">10% peak intensity</p>
        </div>

        <div>
          <Label>Field Angle (°)</Label>
          <Input
            type="number"
            value={fieldAngle}
            onChange={(e) => setFieldAngle(parseFloat(e.target.value) || 0)}
            min={1}
            max={180}
          />
          <p className="text-xs text-gray-400 mt-1">50% peak intensity</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold">Beam Diameter</h3>
          </div>
          <div className="text-4xl font-bold gradient-text mb-2">
            {beamDiameter.toFixed(2)} {distanceUnit}
          </div>
          <p className="text-sm text-gray-400">
            Hot spot (10% peak) at {distance.toFixed(1)} {distanceUnit} throw
          </p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Formula: D = 2 × d × tan(θ/2)
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-magenta-500/10 border-violet-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold">Field Diameter</h3>
          </div>
          <div className="text-4xl font-bold gradient-text mb-2">
            {fieldDiameter.toFixed(2)} {distanceUnit}
          </div>
          <p className="text-sm text-gray-400">
            Total coverage (50% peak) at {distance.toFixed(1)} {distanceUnit} throw
          </p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">
              Beam/Field ratio: {(beamAngle / fieldAngle).toFixed(2)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Coverage Grid Examples</h3>
        <p className="text-sm text-gray-400 mb-4">
          Number of fixtures needed to cover area with 10% overlap
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-300 mb-2">
              10×10{distanceUnit} area:
            </p>
            <p className="text-2xl font-bold text-cyan-300">
              {coverage10x10.wide} × {coverage10x10.high} = {coverage10x10.total} fixtures
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-300 mb-2">
              20×10{distanceUnit} area:
            </p>
            <p className="text-2xl font-bold text-violet-300">
              {coverage20x10.wide} × {coverage20x10.high} = {coverage20x10.total} fixtures
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded">
          <p className="text-xs text-amber-300">
            <strong>Note:</strong> Calculations assume uniform beam distribution and flat surface.
            Real-world coverage varies with fixture type, mounting angle, and color temperature.
          </p>
        </div>
      </Card>
    </div>
  );
}
