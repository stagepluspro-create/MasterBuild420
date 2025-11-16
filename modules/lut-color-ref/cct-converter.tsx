"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Copy, CheckCircle, ArrowRight } from "lucide-react";
import { cctToRGB, rgbToHex, hexToRgb, estimateCCT, calculateDuv } from "@/lib/color-science";

export function CCTConverter() {
  const [cct, setCct] = useState(5600);
  const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });
  const [hex, setHex] = useState("#ffffff");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mode, setMode] = useState<'cct-to-rgb' | 'rgb-to-cct'>('cct-to-rgb');

  const handleCctChange = (value: number) => {
    setCct(value);
    const result = cctToRGB(value);
    setRgb(result.rgb);
    setHex(result.hex);
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [channel]: value };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb));
  };

  const handleHexChange = (value: string) => {
    setHex(value);
    const result = hexToRgb(value);
    if (result) {
      setRgb(result);
    }
  };

  const convertRgbToCct = () => {
    const result = cctToRGB(cct);
    const xy = result.cieXY;
    const estimatedCct = estimateCCT(xy.x, xy.y);
    if (estimatedCct) {
      setCct(estimatedCct);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const presetCcts = [
    { name: 'Candle', value: 1800 },
    { name: 'Tungsten', value: 3200 },
    { name: 'Warm White', value: 3500 },
    { name: 'Neutral', value: 4500 },
    { name: 'Daylight', value: 5600 },
    { name: 'Cool White', value: 6500 },
    { name: 'Overcast', value: 7000 },
    { name: 'Blue Sky', value: 10000 },
  ];

  const result = cctToRGB(cct);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">CCT to RGB Converter</h3>
        <p className="text-sm text-gray-400 mb-6">
          Convert color temperature (Kelvin) to RGB values for LED fixtures and lighting design.
        </p>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-gray-300">Color Temperature</Label>
              <span className="text-white font-mono">{cct}K</span>
            </div>
            <Slider
              value={[cct]}
              onValueChange={([value]) => handleCctChange(value)}
              min={1800}
              max={12000}
              step={100}
              className="mb-4"
            />

            <div className="grid grid-cols-4 gap-2">
              {presetCcts.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCctChange(preset.value)}
                  className={cct === preset.value ? 'border-cyan-500' : ''}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div
            className="w-full h-32 rounded-lg border border-white/20"
            style={{ backgroundColor: result.hex }}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded">
              <div>
                <div className="text-sm text-gray-400">HEX</div>
                <code className="text-white font-mono">{result.hex}</code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result.hex, 'hex')}
              >
                {copiedField === 'hex' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded">
              <div>
                <div className="text-sm text-gray-400">RGB</div>
                <code className="text-white font-mono">
                  {result.rgb.r}, {result.rgb.g}, {result.rgb.b}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${result.rgb.r},${result.rgb.g},${result.rgb.b}`, 'rgb')}
              >
                {copiedField === 'rgb' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 rounded">
              <div>
                <div className="text-sm text-gray-400">CIE xy</div>
                <code className="text-white font-mono">
                  x: {result.cieXY.x.toFixed(4)}, y: {result.cieXY.y.toFixed(4)}
                </code>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(`${result.cieXY.x.toFixed(4)},${result.cieXY.y.toFixed(4)}`, 'xy')}
              >
                {copiedField === 'xy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {!result.inGamut && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-sm text-yellow-300">
                Warning: This CCT value produces colors outside the sRGB gamut. RGB values have been clipped.
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-lg font-medium text-white mb-4">Custom RGB / HEX Input</h3>
        <p className="text-sm text-gray-400 mb-6">
          Enter RGB or HEX values to preview the color. Use with fixture controls or LED consoles.
        </p>

        <div className="space-y-6">
          <div>
            <Label className="text-sm text-gray-300 mb-2 block">HEX Color</Label>
            <div className="flex gap-2">
              <Input
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#FFFFFF"
                className="font-mono"
              />
              <input
                type="color"
                value={hex}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-12 h-10 rounded border border-white/20 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-gray-300">Red: {rgb.r}</Label>
              <Slider
                value={[rgb.r]}
                onValueChange={([value]) => handleRgbChange('r', value)}
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
                onValueChange={([value]) => handleRgbChange('g', value)}
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
                onValueChange={([value]) => handleRgbChange('b', value)}
                min={0}
                max={255}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div
            className="w-full h-32 rounded-lg border border-white/20"
            style={{ backgroundColor: hex }}
          />

          <div className="p-4 bg-white/5 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Decimal RGB:</span>
              <code className="text-white font-mono">{rgb.r}, {rgb.g}, {rgb.b}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Normalized RGB:</span>
              <code className="text-white font-mono">
                {(rgb.r / 255).toFixed(3)}, {(rgb.g / 255).toFixed(3)}, {(rgb.b / 255).toFixed(3)}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">DMX Values:</span>
              <code className="text-white font-mono">{rgb.r}, {rgb.g}, {rgb.b}</code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
