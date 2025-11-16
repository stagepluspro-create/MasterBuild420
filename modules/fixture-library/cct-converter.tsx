"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cctToRGB, cctToXY, calculateDuv } from "@/lib/color-science";
import { AlertCircle } from "lucide-react";

const PRESETS = [
  { label: "Tungsten", cct: 2700 },
  { label: "Warm White", cct: 3000 },
  { label: "Studio", cct: 3200 },
  { label: "Neutral", cct: 4000 },
  { label: "Daylight", cct: 5600 },
  { label: "Cool White", cct: 6500 },
  { label: "Sky", cct: 7500 },
];

export function CCTConverter() {
  const [cct, setCct] = useState(3200);
  const [result, setResult] = useState(cctToRGB(3200));

  const handleCCTChange = (value: number) => {
    const newCCT = Math.max(1000, Math.min(25000, value));
    setCct(newCCT);
    const colorResult = cctToRGB(newCCT);
    const xy = cctToXY(newCCT);
    const duv = calculateDuv(xy.x, xy.y, newCCT);
    setResult({ ...colorResult, duv });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>CCT Input</CardTitle>
            <CardDescription>Enter color temperature in Kelvin (1000-25000K)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Color Temperature (K)
              </label>
              <Input
                type="number"
                value={cct}
                onChange={(e) => handleCCTChange(parseInt(e.target.value) || 3200)}
                min={1000}
                max={25000}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.cct}
                  variant={cct === preset.cct ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCCTChange(preset.cct)}
                >
                  {preset.label}
                  <span className="ml-2 text-xs opacity-70">{preset.cct}K</span>
                </Button>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">CIE x</p>
                  <p className="font-mono">{result.cieXY.x.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">CIE y</p>
                  <p className="font-mono">{result.cieXY.y.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Duv</p>
                  <p className="font-mono">
                    {result.duv !== undefined ? result.duv.toFixed(4) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">HEX</p>
                  <p className="font-mono">{result.hex}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>Color Preview</CardTitle>
            <CardDescription>Approximate sRGB representation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="h-32 rounded-lg border-2 border-white/20"
              style={{ backgroundColor: result.hex }}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">RGB Values</span>
                <span className="font-mono">
                  {result.rgb.r}, {result.rgb.g}, {result.rgb.b}
                </span>
              </div>

              {!result.inGamut && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-300">
                    <p className="font-semibold mb-1">Out of sRGB Gamut</p>
                    <p className="text-amber-400/80">
                      This color cannot be accurately represented on standard displays.
                      Values have been clamped to displayable range.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-16 rounded border border-white/20 flex items-center justify-center text-xs bg-white">
                  <div style={{ color: result.hex }}>On White</div>
                </div>
                <div className="h-16 rounded border border-white/20 flex items-center justify-center text-xs bg-black">
                  <div style={{ color: result.hex }}>On Black</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>About CCT Conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>
            This tool converts Correlated Color Temperature (CCT) to CIE xy coordinates
            using McCamy's approximation for the Planckian locus.
          </p>
          <p>
            <strong className="text-white">Duv</strong> indicates distance from the black body locus.
            Positive values appear magenta, negative values appear green.
          </p>
          <p>
            Colors are converted to sRGB for display. Some high CCT values may fall outside
            the displayable gamut and will show a warning.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
