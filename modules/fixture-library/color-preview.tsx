"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hexToRgb, hexToXY, estimateCCT, rgbToXYZ, XYZToXY } from "@/lib/color-science";
import { AlertCircle } from "lucide-react";

export function ColorPreview() {
  const [hex, setHex] = useState("#FF8C00");
  const [rgb, setRgb] = useState({ r: 255, g: 140, b: 0 });
  const [cieXY, setCieXY] = useState<{ x: number; y: number } | null>(null);
  const [estimatedCCT, setEstimatedCCT] = useState<number | null>(null);

  const handleHexChange = (value: string) => {
    setHex(value);
    const rgbResult = hexToRgb(value);
    if (rgbResult) {
      setRgb(rgbResult);
      const xy = hexToXY(value);
      if (xy) {
        setCieXY(xy);
        const cct = estimateCCT(xy.x, xy.y);
        setEstimatedCCT(cct);
      }
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, value)) };
    setRgb(newRgb);

    const newHex = `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
    setHex(newHex);

    const xyz = rgbToXYZ(newRgb);
    const xy = XYZToXY(xyz);
    setCieXY(xy);
    const cct = estimateCCT(xy.x, xy.y);
    setEstimatedCCT(cct);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>Color Input</CardTitle>
            <CardDescription>Enter HEX code or RGB values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">HEX Color</label>
              <Input
                type="text"
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#FF8C00"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">R</label>
                <Input
                  type="number"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', parseInt(e.target.value) || 0)}
                  min={0}
                  max={255}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">G</label>
                <Input
                  type="number"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', parseInt(e.target.value) || 0)}
                  min={0}
                  max={255}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">B</label>
                <Input
                  type="number"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', parseInt(e.target.value) || 0)}
                  min={0}
                  max={255}
                />
              </div>
            </div>

            {cieXY && (
              <div className="pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">CIE x</p>
                    <p className="font-mono">{cieXY.x.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">CIE y</p>
                    <p className="font-mono">{cieXY.y.toFixed(4)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 mb-1">Estimated CCT</p>
                    <p className="font-mono">
                      {estimatedCCT ? `${estimatedCCT}K` : 'Not near Planckian locus'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/10">
          <CardHeader>
            <CardTitle>Color Preview</CardTitle>
            <CardDescription>Visual representation of your color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="h-32 rounded-lg border-2 border-white/20"
              style={{ backgroundColor: hex }}
            />

            <div className="grid grid-cols-2 gap-2">
              <div
                className="h-16 rounded border border-white/20 flex items-center justify-center text-xs font-semibold bg-white"
              >
                <span style={{ color: hex }}>On White</span>
              </div>
              <div
                className="h-16 rounded border border-white/20 flex items-center justify-center text-xs font-semibold bg-black"
              >
                <span style={{ color: hex }}>On Black</span>
              </div>
              <div
                className="h-16 rounded border border-white/20 flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: hex }}
              >
                <span className="text-white mix-blend-difference">Text</span>
              </div>
              <div
                className="h-16 rounded border border-white/20 flex items-center justify-center text-xs"
                style={{ backgroundColor: hex, opacity: 0.5 }}
              >
                <span className="text-white">50% Opacity</span>
              </div>
            </div>

            {!estimatedCCT && cieXY && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <p className="font-semibold mb-1">Not a White Point</p>
                  <p className="text-blue-400/80">
                    This color is too far from the Planckian locus to estimate a CCT.
                    It's a saturated color rather than a white point.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>Color Mixing Hint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-400">
          <p>
            <strong className="text-white">RGB Fixtures:</strong> Use R={rgb.r}, G={rgb.g}, B={rgb.b} (scaled to 0-255)
          </p>
          <p>
            <strong className="text-white">CMY Fixtures:</strong> C={255 - rgb.r}, M={255 - rgb.g}, Y={255 - rgb.b}
          </p>
          <p className="text-xs text-gray-500">
            Note: Actual color output depends on fixture's LED/filter spectral characteristics.
            Use as starting point and adjust by eye.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
