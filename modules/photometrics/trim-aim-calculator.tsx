"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Move, Target } from "lucide-react";

interface TrimAimCalculatorProps {
  units: "metric" | "imperial";
}

export function TrimAimCalculator({ units }: TrimAimCalculatorProps) {
  const [trimHeight, setTrimHeight] = useState(6);
  const [horizontalDistance, setHorizontalDistance] = useState(10);
  const [tiltAngle, setTiltAngle] = useState(45);
  const [beamAngle, setBeamAngle] = useState(26);

  const distanceUnit = units === "metric" ? "m" : "ft";

  const tiltRad = (tiltAngle * Math.PI) / 180;

  const throwDistance = Math.sqrt(
    horizontalDistance * horizontalDistance +
    (trimHeight * trimHeight)
  );

  const actualTiltAngle = Math.atan2(trimHeight, horizontalDistance) * (180 / Math.PI);

  const stageHitX = horizontalDistance;
  const stageHitY = 0;

  const ellipseMinorAxis = 2 * throwDistance * Math.tan((beamAngle * Math.PI) / 360);
  const ellipseMajorAxis = ellipseMinorAxis / Math.sin(tiltRad);

  const centerIntensityLoss = Math.cos(tiltRad);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Trim Height ({distanceUnit})</Label>
          <Input
            type="number"
            value={trimHeight}
            onChange={(e) => setTrimHeight(parseFloat(e.target.value) || 0)}
            min={0}
            step={0.1}
          />
          <p className="text-xs text-gray-400 mt-1">Vertical position above stage</p>
        </div>
        <div>
          <Label>Horizontal Distance ({distanceUnit})</Label>
          <Input
            type="number"
            value={horizontalDistance}
            onChange={(e) => setHorizontalDistance(parseFloat(e.target.value) || 0)}
            min={0}
            step={0.1}
          />
          <p className="text-xs text-gray-400 mt-1">From fixture to stage point</p>
        </div>
        <div>
          <Label>Tilt Angle (°)</Label>
          <Input
            type="number"
            value={tiltAngle}
            onChange={(e) => setTiltAngle(parseFloat(e.target.value) || 0)}
            min={0}
            max={90}
          />
          <p className="text-xs text-gray-400 mt-1">Down from horizontal</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Move className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold">Throw Calculations</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Actual Throw Distance</p>
              <p className="text-3xl font-bold gradient-text">
                {throwDistance.toFixed(2)} {distanceUnit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                √(h² + d²) = √({trimHeight}² + {horizontalDistance}²)
              </p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-gray-400 mb-1">Calculated Angle</p>
              <p className="text-2xl font-bold text-cyan-300">
                {actualTiltAngle.toFixed(1)}°
              </p>
              <p className="text-xs text-gray-500 mt-1">
                arctan(height / distance)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-magenta-500/10 border-violet-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold">Stage Hit Position</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Downstage Distance</p>
              <p className="text-3xl font-bold text-violet-300">
                {stageHitX.toFixed(2)} {distanceUnit}
              </p>
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-gray-400 mb-1">Stage Level (Y)</p>
              <p className="text-2xl font-bold text-magenta-300">
                {stageHitY.toFixed(2)} {distanceUnit}
              </p>
              <p className="text-xs text-gray-500 mt-1">At floor level</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Ellipse Footprint from Angle</h3>
        <p className="text-sm text-gray-400 mb-4">
          When light hits at an angle, the circular beam becomes elliptical
        </p>

        <div>
          <Label>Beam Angle (°)</Label>
          <Input
            type="number"
            value={beamAngle}
            onChange={(e) => setBeamAngle(parseFloat(e.target.value) || 0)}
            min={1}
            max={180}
            className="max-w-xs mb-4"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Minor Axis (across)</p>
            <p className="text-2xl font-bold text-cyan-300">
              {ellipseMinorAxis.toFixed(2)} {distanceUnit}
            </p>
            <p className="text-xs text-gray-500 mt-1">Perpendicular to throw</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Major Axis (along)</p>
            <p className="text-2xl font-bold text-violet-300">
              {ellipseMajorAxis.toFixed(2)} {distanceUnit}
            </p>
            <p className="text-xs text-gray-500 mt-1">Along throw direction</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-sm text-gray-400 mb-2">Intensity Loss</p>
            <p className="text-2xl font-bold text-magenta-300">
              {(centerIntensityLoss * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">cos({tiltAngle}°)</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
          <p className="text-xs text-cyan-300">
            <strong>Note:</strong> Ellipse major axis = minor axis / sin(tilt angle).
            Center intensity is reduced by cosine of angle due to increased area coverage.
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Common Trims</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <button
            onClick={() => {
              setTrimHeight(units === "metric" ? 3 : 10);
              setHorizontalDistance(units === "metric" ? 5 : 16);
            }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-left transition-colors"
          >
            <p className="text-gray-400 mb-1">Low Trim</p>
            <p className="text-white font-semibold">
              {units === "metric" ? "3m" : "10ft"} @ {units === "metric" ? "5m" : "16ft"}
            </p>
          </button>
          <button
            onClick={() => {
              setTrimHeight(units === "metric" ? 6 : 20);
              setHorizontalDistance(units === "metric" ? 10 : 33);
            }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-left transition-colors"
          >
            <p className="text-gray-400 mb-1">Standard Trim</p>
            <p className="text-white font-semibold">
              {units === "metric" ? "6m" : "20ft"} @ {units === "metric" ? "10m" : "33ft"}
            </p>
          </button>
          <button
            onClick={() => {
              setTrimHeight(units === "metric" ? 12 : 40);
              setHorizontalDistance(units === "metric" ? 15 : 50);
            }}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-left transition-colors"
          >
            <p className="text-gray-400 mb-1">High Trim</p>
            <p className="text-white font-semibold">
              {units === "metric" ? "12m" : "40ft"} @ {units === "metric" ? "15m" : "50ft"}
            </p>
          </button>
        </div>
      </Card>
    </div>
  );
}
