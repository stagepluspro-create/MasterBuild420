"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ND_FILTERS = [
  { name: "ND 0.3", stops: 1, reduction: "50%" },
  { name: "ND 0.6", stops: 2, reduction: "25%" },
  { name: "ND 0.9", stops: 3, reduction: "12.5%" },
  { name: "ND 1.2", stops: 4, reduction: "6.25%" },
  { name: "ND 1.5", stops: 5, reduction: "3.125%" },
  { name: "ND 1.8", stops: 6, reduction: "1.56%" },
  { name: "ND 2.1", stops: 7, reduction: "0.78%" },
  { name: "ND 3.0", stops: 10, reduction: "0.098%" },
];

export default function NDExposure() {
  const [fStop, setFStop] = useState("2.8");
  const [shutter, setShutter] = useState("1/50");
  const [iso, setIso] = useState("800");
  const [ndStops, setNdStops] = useState("3");

  const calculateExposure = () => {
    const stops = parseFloat(ndStops);
    const currentF = parseFloat(fStop);
    const currentISO = parseInt(iso);

    const newF = currentF * Math.pow(2, stops / 2);
    const newISO = currentISO * Math.pow(2, stops);

    return {
      newFStop: newF.toFixed(1),
      newISO: Math.round(newISO),
      originalEV: `f/${fStop} @ ISO ${iso}`,
      ndFilteredEV: `f/${newF.toFixed(1)} @ ISO ${currentISO} with ND${stops}`,
    };
  };

  const result = calculateExposure();

  const getCurrentState = () => ({ fStop, shutter, iso, ndStops });
  const handleLoadPreset = (data: any) => {
    if (data.fStop) setFStop(data.fStop);
    if (data.shutter) setShutter(data.shutter);
    if (data.iso) setIso(data.iso);
    if (data.ndStops) setNdStops(data.ndStops);
  };

  return (
    <ToolShell
      toolId="nd-exposure"
      toolName="ND/Exposure Helper"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Current Exposure Settings</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>F-Stop</Label>
              <Input
                type="number"
                step="0.1"
                value={fStop}
                onChange={(e) => setFStop(e.target.value)}
                placeholder="2.8"
              />
            </div>
            <div>
              <Label>Shutter Speed</Label>
              <Select value={shutter} onValueChange={setShutter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1/24">1/24</SelectItem>
                  <SelectItem value="1/30">1/30</SelectItem>
                  <SelectItem value="1/50">1/50 (PAL)</SelectItem>
                  <SelectItem value="1/60">1/60 (NTSC)</SelectItem>
                  <SelectItem value="1/100">1/100</SelectItem>
                  <SelectItem value="1/120">1/120</SelectItem>
                  <SelectItem value="1/250">1/250</SelectItem>
                  <SelectItem value="1/500">1/500</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ISO</Label>
              <Input
                type="number"
                step="100"
                value={iso}
                onChange={(e) => setIso(e.target.value)}
                placeholder="800"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">ND Filter Selection</h3>
          <Label>ND Filter Strength (stops)</Label>
          <Select value={ndStops} onValueChange={setNdStops}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ND_FILTERS.map((filter) => (
                <SelectItem key={filter.name} value={filter.stops.toString()}>
                  {filter.name} ({filter.stops} stops - {filter.reduction})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10">
          <h3 className="text-lg font-bold text-white mb-4">Exposure Calculation Results</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Without ND Filter</div>
              <div className="text-xl font-mono text-white">{result.originalEV}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Equivalent With ND Filter</div>
              <div className="text-xl font-mono text-cyan-400">{result.ndFilteredEV}</div>
            </div>
            <div className="pt-4 border-t border-white/10">
              <div className="text-sm text-gray-400 mb-2">Alternative Adjustments (without ND)</div>
              <div className="space-y-1 text-sm">
                <div>Open aperture to: <span className="font-mono text-white">f/{result.newFStop}</span></div>
                <div>Or increase ISO to: <span className="font-mono text-white">{result.newISO}</span></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <h4 className="font-semibold text-blue-300 mb-2">Exposure Triangle</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <p>• Aperture (f-stop): Controls depth of field and light amount</p>
            <p>• Shutter Speed: Controls motion blur and light duration</p>
            <p>• ISO: Controls sensor sensitivity and noise</p>
            <p>• ND Filter: Reduces light without affecting other settings</p>
          </div>
        </Card>
      </div>
    </ToolShell>
  );
}
