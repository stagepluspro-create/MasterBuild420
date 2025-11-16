"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { ColorSpace, convertColorSpace, isInGamut, getColorSpaceInfo } from "./color-space-converter";
import { rgbToHex } from "@/lib/color-science";

export function ColorSpaceTools() {
  const [sourceSpace, setSourceSpace] = useState<ColorSpace>('sRGB');
  const [targetSpace, setTargetSpace] = useState<ColorSpace>('Rec709');
  const [rgb, setRgb] = useState({ r: 128, g: 128, b: 128 });

  const sourceColor = rgb;
  const targetColor = convertColorSpace(sourceColor, sourceSpace, targetSpace);
  const sourceHex = rgbToHex(sourceColor);
  const targetHex = rgbToHex(targetColor);
  const sourceInGamut = isInGamut(sourceColor, sourceSpace);
  const targetInGamut = isInGamut(targetColor, targetSpace);

  const sourceInfo = getColorSpaceInfo(sourceSpace);
  const targetInfo = getColorSpaceInfo(targetSpace);

  const colorSpaces: ColorSpace[] = ['sRGB', 'Rec709', 'Rec2020', 'DCIP3', 'ACEScg'];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">Color Space Converter</h3>
        <p className="text-sm text-gray-400 mb-6">
          Convert colors between different color spaces used in broadcast, cinema, and LED displays.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div>
            <Label className="text-sm text-gray-300 mb-2 block">Source Color Space</Label>
            <Select value={sourceSpace} onValueChange={(v) => setSourceSpace(v as ColorSpace)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorSpaces.map(space => (
                  <SelectItem key={space} value={space}>{space}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4 space-y-3">
              <div
                className="w-full h-32 rounded-lg border border-white/20"
                style={{ backgroundColor: sourceHex }}
              />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">RGB:</span>
                  <code className="text-white font-mono">
                    {sourceColor.r}, {sourceColor.g}, {sourceColor.b}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">HEX:</span>
                  <code className="text-white font-mono">{sourceHex}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gamma:</span>
                  <span className="text-white">{sourceInfo.gamma.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">In Gamut:</span>
                  <span className={sourceInGamut ? 'text-green-400' : 'text-red-400'}>
                    {sourceInGamut ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ArrowRight className="h-8 w-8 text-cyan-500" />
          </div>

          <div>
            <Label className="text-sm text-gray-300 mb-2 block">Target Color Space</Label>
            <Select value={targetSpace} onValueChange={(v) => setTargetSpace(v as ColorSpace)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorSpaces.map(space => (
                  <SelectItem key={space} value={space}>{space}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4 space-y-3">
              <div
                className="w-full h-32 rounded-lg border border-white/20"
                style={{ backgroundColor: targetHex }}
              />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">RGB:</span>
                  <code className="text-white font-mono">
                    {targetColor.r}, {targetColor.g}, {targetColor.b}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">HEX:</span>
                  <code className="text-white font-mono">{targetHex}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gamma:</span>
                  <span className="text-white">{targetInfo.gamma.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">In Gamut:</span>
                  <span className={targetInGamut ? 'text-green-400' : 'text-red-400'}>
                    {targetInGamut ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">Input Color</h3>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-gray-300">Red: {rgb.r}</Label>
            <Slider
              value={[rgb.r]}
              onValueChange={([value]) => setRgb({ ...rgb, r: value })}
              min={0}
              max={255}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-300">Green: {rgb.g}</Label>
            <Slider
              value={[rgb.g]}
              onValueChange={([value]) => setRgb({ ...rgb, g: value })}
              min={0}
              max={255}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm text-gray-300">Blue: {rgb.b}</Label>
            <Slider
              value={[rgb.b]}
              onValueChange={([value]) => setRgb({ ...rgb, b: value })}
              min={0}
              max={255}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-medium text-white mb-3">Color Space Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">sRGB / Rec.709</h4>
            <p className="text-gray-400">
              Standard color space for web, photography, and HD broadcast. Identical primaries with 2.4 gamma curve.
            </p>
          </div>
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">Rec.2020</h4>
            <p className="text-gray-400">
              Ultra HD (4K/8K) broadcast standard with wider color gamut covering ~75% of visible colors.
            </p>
          </div>
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">DCI-P3</h4>
            <p className="text-gray-400">
              Digital cinema standard with ~26% larger gamut than sRGB. Used in professional displays and projectors.
            </p>
          </div>
          <div>
            <h4 className="text-cyan-400 font-medium mb-2">ACEScg</h4>
            <p className="text-gray-400">
              Academy Color Encoding System for visual effects and color grading. Linear color space (gamma 1.0).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
