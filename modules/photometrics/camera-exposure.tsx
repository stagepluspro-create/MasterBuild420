"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Camera, Film } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface CameraExposureProps {
  units: "metric" | "imperial";
}

export function CameraExposure({ units }: CameraExposureProps) {
  const [targetLux, setTargetLux] = useState(800);
  const [iso, setIso] = useState(800);
  const [shutterSpeed, setShutterSpeed] = useState(50);
  const [desiredFStop, setDesiredFStop] = useState(2.8);

  const luxInMetric = units === "metric" ? targetLux : targetLux * 10.764;

  const ev100 = Math.log2(luxInMetric / 2.5);
  const ev = ev100 + Math.log2(iso / 100);

  const shutterSpeedFraction = 1 / shutterSpeed;

  const calculatedFStop = Math.sqrt(Math.pow(2, ev) * shutterSpeedFraction);

  const requiredLux = (Math.pow(desiredFStop, 2) * Math.pow(2, ev100) * shutterSpeed) / (iso / 100);

  const isoStops = [100, 200, 400, 800, 1600, 3200, 6400];
  const shutterSpeeds = [24, 25, 30, 48, 50, 60, 120, 250, 500, 1000];
  const fStops = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Scene Illuminance</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Target Illuminance</Label>
            <Input
              type="number"
              value={targetLux}
              onChange={(e) => setTargetLux(parseFloat(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-gray-400 mt-1">
              {units === "metric" ? "lux" : "foot-candles"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Exposure Value (EV)</p>
            <p className="text-4xl font-bold gradient-text">{ev.toFixed(1)}</p>
            <p className="text-xs text-gray-500 mt-1">At ISO {iso}</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border-cyan-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold">Calculate f-Stop</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Given illuminance, ISO, and shutter speed
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <Label>ISO</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {isoStops.map((value) => (
                  <button
                    key={value}
                    onClick={() => setIso(value)}
                    className={`px-3 py-1 text-sm rounded ${
                      iso === value
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={iso}
                onChange={(e) => setIso(parseInt(e.target.value) || 100)}
                min={100}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Shutter Speed (fps)</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {shutterSpeeds.map((value) => (
                  <button
                    key={value}
                    onClick={() => setShutterSpeed(value)}
                    className={`px-3 py-1 text-sm rounded ${
                      shutterSpeed === value
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={shutterSpeed}
                onChange={(e) => setShutterSpeed(parseFloat(e.target.value) || 24)}
                min={1}
                className="mt-2"
              />
              <p className="text-xs text-gray-400 mt-1">1/{shutterSpeed} second</p>
            </div>
          </div>

          <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <p className="text-sm text-cyan-300 mb-2">Recommended f-Stop</p>
            <p className="text-5xl font-bold text-cyan-200 mb-2">
              f/{calculatedFStop.toFixed(1)}
            </p>
            <p className="text-xs text-cyan-400">
              Based on {luxInMetric.toFixed(0)} lux scene illuminance
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-violet-500/10 to-magenta-500/10 border-violet-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold">Calculate Required Lux</h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Given desired f-stop and camera settings
          </p>

          <div className="mb-6">
            <Label>Desired f-Stop</Label>
            <div className="flex gap-2 flex-wrap mt-2 mb-2">
              {fStops.map((value) => (
                <button
                  key={value}
                  onClick={() => setDesiredFStop(value)}
                  className={`px-3 py-1 text-sm rounded ${
                    desiredFStop === value
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                      : "bg-white/5 text-gray-400 border border-white/10"
                  }`}
                >
                  f/{value}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={desiredFStop}
              onChange={(e) => setDesiredFStop(parseFloat(e.target.value) || 2.8)}
              min={1}
              step={0.1}
            />
          </div>

          <div className="p-4 bg-violet-500/10 rounded-lg border border-violet-500/30">
            <p className="text-sm text-violet-300 mb-2">Required Illuminance</p>
            <p className="text-5xl font-bold text-violet-200 mb-2">
              {requiredLux.toFixed(0)}
            </p>
            <p className="text-xl text-violet-300 mb-2">lux</p>
            <p className="text-xs text-violet-400">
              To shoot at f/{desiredFStop} @ ISO {iso}, 1/{shutterSpeed}s
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-semibold mb-4">Exposure Reference</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Standard Film/TV Key</p>
            <p className="text-white font-semibold">800-1200 lux</p>
            <p className="text-xs text-gray-500 mt-1">f/2.8-4 @ ISO 800</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">Low Light / Interviews</p>
            <p className="text-white font-semibold">200-400 lux</p>
            <p className="text-xs text-gray-500 mt-1">f/2-2.8 @ ISO 1600</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">High Key / Outdoors</p>
            <p className="text-white font-semibold">2000-5000 lux</p>
            <p className="text-xs text-gray-500 mt-1">f/5.6-8 @ ISO 400</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">24fps Cine</p>
            <p className="text-white font-semibold">1/48s shutter</p>
            <p className="text-xs text-gray-500 mt-1">180° shutter angle</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">25fps Video</p>
            <p className="text-white font-semibold">1/50s shutter</p>
            <p className="text-xs text-gray-500 mt-1">Standard PAL</p>
          </div>
          <div>
            <p className="text-gray-400 mb-2">60fps Slow-Mo</p>
            <p className="text-white font-semibold">1/120s shutter</p>
            <p className="text-xs text-gray-500 mt-1">Needs 2x more light</p>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-sm text-cyan-300 font-semibold mb-2">Calculation Notes</p>
        <ul className="text-xs text-cyan-200 space-y-1">
          <li>• EV₁₀₀ ≈ log₂(lux / 2.5) using ANSI 18% gray reflectance</li>
          <li>• EV = EV₁₀₀ + log₂(ISO/100)</li>
          <li>• f² / t = 2^EV where f = f-number, t = shutter time</li>
          <li>• These are approximations for quick field calculations</li>
          <li>• Actual exposure depends on sensor characteristics and color science</li>
          <li>• Always test with waveform/false color monitors for critical work</li>
        </ul>
      </div>
    </div>
  );
}
