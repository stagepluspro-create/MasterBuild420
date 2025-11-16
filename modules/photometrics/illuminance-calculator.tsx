"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Lightbulb, AlertTriangle, Info } from "lucide-react";

interface IlluminanceCalculatorProps {
  units: "metric" | "imperial";
  distance: number;
  setDistance: (value: number) => void;
  beamAngle: number;
  cbcp: number;
  setCbcp: (value: number) => void;
  lumens: number;
  setLumens: (value: number) => void;
  useEstimate: boolean;
  setUseEstimate: (value: boolean) => void;
}

export function IlluminanceCalculator({
  units,
  distance,
  setDistance,
  beamAngle,
  cbcp,
  setCbcp,
  lumens,
  setLumens,
  useEstimate,
  setUseEstimate,
}: IlluminanceCalculatorProps) {
  const distanceUnit = units === "metric" ? "m" : "ft";

  const distanceInMeters = units === "metric" ? distance : distance * 0.3048;

  const solidAngle = 2 * Math.PI * (1 - Math.cos((beamAngle * Math.PI) / 360));
  const estimatedCBCP = lumens / solidAngle;

  const effectiveCBCP = useEstimate ? estimatedCBCP : cbcp;

  const luxAtDistance = effectiveCBCP / (distanceInMeters * distanceInMeters);
  const footCandles = luxAtDistance / 10.764;

  const illuminanceValue = units === "metric" ? luxAtDistance : footCandles;
  const illuminanceUnit = units === "metric" ? "lux" : "fc";

  const targetLux = 800;
  const requiredDistance = Math.sqrt(effectiveCBCP / targetLux);
  const requiredDistanceDisplay = units === "metric" ? requiredDistance : requiredDistance * 3.28;

  const targetLuxLow = 200;
  const requiredDistanceLow = Math.sqrt(effectiveCBCP / targetLuxLow);
  const requiredDistanceLowDisplay = units === "metric" ? requiredDistanceLow : requiredDistanceLow * 3.28;

  const isHighIntensity = luxAtDistance > 100000;
  const isCloseRange = distanceInMeters < 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <Switch
          checked={useEstimate}
          onCheckedChange={setUseEstimate}
        />
        <div className="flex-1">
          <Label className="text-base">
            {useEstimate ? "Estimate CBCP from Lumens" : "Use Known CBCP"}
          </Label>
          <p className="text-xs text-gray-400 mt-1">
            {useEstimate
              ? "Approximate center beam intensity from total lumen output"
              : "Enter measured center beam candlepower from photometric data"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Distance ({distanceUnit})</Label>
          <Input
            type="number"
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
            min={0}
            step={units === "metric" ? 0.1 : 1}
          />
        </div>

        {useEstimate ? (
          <>
            <div>
              <Label>Total Lumens (Φ)</Label>
              <Input
                type="number"
                value={lumens}
                onChange={(e) => setLumens(parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
            <div>
              <Label>Beam Angle (°)</Label>
              <Input
                type="number"
                value={beamAngle}
                disabled
                className="bg-white/5"
              />
              <p className="text-xs text-gray-400 mt-1">Used for CBCP estimate</p>
            </div>
          </>
        ) : (
          <div className="md:col-span-2">
            <Label>Center Beam Candlepower (CBCP) in candelas</Label>
            <Input
              type="number"
              value={cbcp}
              onChange={(e) => setCbcp(parseFloat(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-gray-400 mt-1">
              From manufacturer photometric data or IES file
            </p>
          </div>
        )}
      </div>

      {useEstimate && (
        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-cyan-300 font-semibold mb-1">Estimated CBCP</p>
            <p className="text-xs text-cyan-200">
              Calculated: {estimatedCBCP.toFixed(0)} cd using Ω = 2π(1 - cos(θ/2)) ≈ {solidAngle.toFixed(4)} sr
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This is an approximation assuming uniform beam distribution. Real CBCP values vary by fixture design.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold">Illuminance at Subject</h3>
          </div>
          <div className="text-5xl font-bold gradient-text mb-2">
            {illuminanceValue.toFixed(1)}
          </div>
          <p className="text-xl text-gray-300 mb-4">{illuminanceUnit}</p>
          <p className="text-sm text-gray-400">
            At {distance.toFixed(1)} {distanceUnit} throw distance
          </p>
          {units === "metric" && (
            <p className="text-sm text-gray-500 mt-2">
              ({footCandles.toFixed(1)} foot-candles)
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">
              E (lux) = I (cd) / d² (m²)
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-semibold mb-4">Distance Planning</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">For key light (800 lux):</p>
              <p className="text-2xl font-bold text-cyan-300">
                {requiredDistanceDisplay.toFixed(2)} {distanceUnit}
              </p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-2">For wash (200 lux):</p>
              <p className="text-2xl font-bold text-violet-300">
                {requiredDistanceLowDisplay.toFixed(2)} {distanceUnit}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {(isHighIntensity || isCloseRange) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-300 font-semibold mb-1">Safety Warning</p>
            {isHighIntensity && (
              <p className="text-xs text-amber-200 mb-1">
                High intensity illumination ({luxAtDistance.toFixed(0)} lux). Risk of eye damage and overheating.
              </p>
            )}
            {isCloseRange && (
              <p className="text-xs text-amber-200">
                Fixture is very close to subject ({distanceInMeters.toFixed(1)}m). Check heat output and safe operating distance.
              </p>
            )}
          </div>
        </div>
      )}

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Reference Values</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Film/TV Key Light</p>
            <p className="text-white font-semibold">800-1200 lux</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Stage Wash</p>
            <p className="text-white font-semibold">200-400 lux</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Theatrical Special</p>
            <p className="text-white font-semibold">2000+ lux</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Office/Indoor</p>
            <p className="text-white font-semibold">300-500 lux</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Outdoor Daylight</p>
            <p className="text-white font-semibold">10,000-100,000 lux</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Direct Sunlight</p>
            <p className="text-white font-semibold">100,000+ lux</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
