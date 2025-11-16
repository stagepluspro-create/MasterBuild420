"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Grid3x3, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArrayPlannerProps {
  units: "metric" | "imperial";
  distance: number;
  beamAngle: number;
  fieldAngle: number;
  cbcp: number;
}

export function ArrayPlanner({
  units,
  distance,
  beamAngle,
  fieldAngle,
  cbcp,
}: ArrayPlannerProps) {
  const { toast } = useToast();
  const [targetWidth, setTargetWidth] = useState(20);
  const [targetHeight, setTargetHeight] = useState(10);
  const [overlap, setOverlap] = useState(10);
  const [numFixtures, setNumFixtures] = useState(4);
  const [diversityFactor, setDiversityFactor] = useState(0.8);

  const distanceUnit = units === "metric" ? "m" : "ft";
  const distanceInMeters = units === "metric" ? distance : distance * 0.3048;

  const fieldDiameter = 2 * distance * Math.tan((fieldAngle * Math.PI) / 360);
  const effectiveDiameter = fieldDiameter * (1 - overlap / 100);

  const fixturesWide = Math.ceil(targetWidth / effectiveDiameter);
  const fixturesHigh = Math.ceil(targetHeight / effectiveDiameter);
  const totalFixturesNeeded = fixturesWide * fixturesHigh;

  const spacing = effectiveDiameter;

  const luxPerFixture = cbcp / (distanceInMeters * distanceInMeters);

  const naiveTotalLux = luxPerFixture * numFixtures;
  const effectiveTotalLux = luxPerFixture + (luxPerFixture * (numFixtures - 1) * diversityFactor);

  const handleCopyResults = () => {
    const results = `Array Planning Results
==================
Target Area: ${targetWidth} × ${targetHeight} ${distanceUnit}
Throw Distance: ${distance} ${distanceUnit}
Field Diameter: ${fieldDiameter.toFixed(2)} ${distanceUnit}
Overlap: ${overlap}%

Grid Configuration:
- Fixtures Wide: ${fixturesWide}
- Fixtures High: ${fixturesHigh}
- Total Fixtures: ${totalFixturesNeeded}
- Spacing: ${spacing.toFixed(2)} ${distanceUnit}

Illuminance (${numFixtures} fixtures):
- Per Fixture: ${luxPerFixture.toFixed(0)} lux
- Naive Sum: ${naiveTotalLux.toFixed(0)} lux
- With ${(diversityFactor * 100).toFixed(0)}% diversity: ${effectiveTotalLux.toFixed(0)} lux
`;

    navigator.clipboard.writeText(results);
    toast({
      title: "Copied to clipboard",
      description: "Array planning results copied",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-semibold mb-4">Target Coverage Area</h3>
          <div className="space-y-4">
            <div>
              <Label>Width ({distanceUnit})</Label>
              <Input
                type="number"
                value={targetWidth}
                onChange={(e) => setTargetWidth(parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div>
              <Label>Height ({distanceUnit})</Label>
              <Input
                type="number"
                value={targetHeight}
                onChange={(e) => setTargetHeight(parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div>
              <Label>Overlap Percentage: {overlap}%</Label>
              <Slider
                value={[overlap]}
                onValueChange={(v) => setOverlap(v[0])}
                min={0}
                max={50}
                step={5}
                className="mt-2"
              />
              <p className="text-xs text-gray-400 mt-1">
                Recommended 10-20% for smooth wash, 30-50% for even coverage
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold">Grid Configuration</h3>
            </div>
            <button
              onClick={handleCopyResults}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Copy results"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Fixtures Wide</p>
              <p className="text-3xl font-bold text-cyan-300">{fixturesWide}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Fixtures High</p>
              <p className="text-3xl font-bold text-violet-300">{fixturesHigh}</p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-gray-400 mb-1">Total Fixtures Needed</p>
              <p className="text-4xl font-bold gradient-text">{totalFixturesNeeded}</p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-gray-400 mb-1">Center-to-Center Spacing</p>
              <p className="text-2xl font-bold text-white">
                {spacing.toFixed(2)} {distanceUnit}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Array Illuminance Summation</h3>
        <p className="text-sm text-gray-400 mb-4">
          Calculate total illuminance at center point from overlapping fixtures
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label>Number of Overlapping Fixtures</Label>
            <Input
              type="number"
              value={numFixtures}
              onChange={(e) => setNumFixtures(parseInt(e.target.value) || 1)}
              min={1}
              max={20}
            />
          </div>
          <div>
            <Label>Diversity Factor: {(diversityFactor * 100).toFixed(0)}%</Label>
            <Slider
              value={[diversityFactor * 100]}
              onValueChange={(v) => setDiversityFactor(v[0] / 100)}
              min={50}
              max={100}
              step={5}
              className="mt-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Accounts for angle of incidence and beam profile
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Per Fixture</p>
            <p className="text-2xl font-bold text-cyan-300">
              {luxPerFixture.toFixed(0)} lux
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Naive Sum</p>
            <p className="text-2xl font-bold text-violet-300">
              {naiveTotalLux.toFixed(0)} lux
            </p>
            <p className="text-xs text-gray-500 mt-1">Linear addition</p>
          </div>
          <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <p className="text-sm text-cyan-300 mb-2">Effective Total</p>
            <p className="text-2xl font-bold text-cyan-200">
              {effectiveTotalLux.toFixed(0)} lux
            </p>
            <p className="text-xs text-cyan-400 mt-1">With diversity</p>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-sm text-cyan-300 font-semibold mb-2">Planning Notes</p>
        <ul className="text-xs text-cyan-200 space-y-1">
          <li>• Field diameter: {fieldDiameter.toFixed(2)} {distanceUnit} at {distance} {distanceUnit} throw</li>
          <li>• Effective coverage per fixture with {overlap}% overlap: {effectiveDiameter.toFixed(2)} {distanceUnit}</li>
          <li>• For smooth wash, maintain consistent trim heights and aim angles</li>
          <li>• Consider using barn doors or shutters at edges to control spill</li>
          <li>• Diversity factor accounts for reduced overlap efficiency away from center</li>
        </ul>
      </div>
    </div>
  );
}
