"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASPECT_RATIOS = [
  { name: "16:9", value: 16 / 9, description: "HD/4K Standard" },
  { name: "4:3", value: 4 / 3, description: "SD Standard" },
  { name: "21:9", value: 21 / 9, description: "Ultrawide" },
  { name: "2.39:1", value: 2.39, description: "Cinemascope" },
  { name: "1.85:1", value: 1.85, description: "Cinema Flat" },
  { name: "1:1", value: 1, description: "Square" },
];

const FRAMERATES = [
  { name: "23.976", value: 23.976, description: "Film (NTSC)" },
  { name: "24", value: 24, description: "Film" },
  { name: "25", value: 25, description: "PAL" },
  { name: "29.97", value: 29.97, description: "NTSC" },
  { name: "30", value: 30, description: "Standard" },
  { name: "50", value: 50, description: "PAL High" },
  { name: "59.94", value: 59.94, description: "NTSC High" },
  { name: "60", value: 60, description: "High Frame Rate" },
];

export default function AspectFramerate() {
  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [frames, setFrames] = useState("24");
  const [duration, setDuration] = useState("60");

  const calculateAspect = () => {
    const w = parseInt(width);
    const h = parseInt(height);
    if (w && h) {
      const ratio = w / h;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(w, h);
      return {
        decimal: ratio.toFixed(3),
        ratio: `${w / divisor}:${h / divisor}`,
        closest: ASPECT_RATIOS.reduce((prev, curr) =>
          Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev
        ),
      };
    }
    return null;
  };

  const calculateTimecode = () => {
    const fps = parseFloat(frames);
    const secs = parseInt(duration);
    if (fps && secs) {
      const totalFrames = Math.floor(fps * secs);
      const hours = Math.floor(secs / 3600);
      const mins = Math.floor((secs % 3600) / 60);
      const seconds = secs % 60;
      const frameNum = Math.floor((secs - Math.floor(secs)) * fps);
      return {
        timecode: `${hours.toString().padStart(2, "0")}:${mins
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frameNum
          .toString()
          .padStart(2, "0")}`,
        totalFrames,
      };
    }
    return null;
  };

  const aspectResult = calculateAspect();
  const timecodeResult = calculateTimecode();

  const getCurrentState = () => ({ width, height, frames, duration });
  const handleLoadPreset = (data: any) => {
    if (data.width) setWidth(data.width);
    if (data.height) setHeight(data.height);
    if (data.frames) setFrames(data.frames);
    if (data.duration) setDuration(data.duration);
  };

  return (
    <ToolShell
      toolId="aspect-framerate"
      toolName="Aspect/Framerate/Timecode Calculator"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <Tabs defaultValue="aspect" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aspect">Aspect Ratio</TabsTrigger>
          <TabsTrigger value="timecode">Timecode</TabsTrigger>
        </TabsList>

        <TabsContent value="aspect" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Calculate Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Width (pixels)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="1920"
                />
              </div>
              <div>
                <Label>Height (pixels)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="1080"
                />
              </div>
            </div>

            {aspectResult && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Decimal Ratio</div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {aspectResult.decimal}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Simplified Ratio</div>
                    <div className="text-2xl font-bold text-white">{aspectResult.ratio}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Closest Standard</div>
                    <div className="text-2xl font-bold text-violet-400">
                      {aspectResult.closest.name}
                    </div>
                    <div className="text-xs text-gray-500">{aspectResult.closest.description}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ASPECT_RATIOS.map((ar) => (
              <Card
                key={ar.name}
                className="p-4 cursor-pointer hover:border-cyan-400 transition-colors"
                onClick={() => {
                  const h = 1080;
                  const w = Math.round(h * ar.value);
                  setWidth(w.toString());
                  setHeight(h.toString());
                }}
              >
                <div className="text-xl font-bold text-white mb-1">{ar.name}</div>
                <div className="text-sm text-gray-400">{ar.description}</div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timecode" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Calculate SMPTE Timecode</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Frame Rate (fps)</Label>
                <Select value={frames} onValueChange={setFrames}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMERATES.map((fr) => (
                      <SelectItem key={fr.name} value={fr.value.toString()}>
                        {fr.name} fps - {fr.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            {timecodeResult && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">SMPTE Timecode</div>
                    <div className="text-3xl font-mono font-bold text-cyan-400">
                      {timecodeResult.timecode}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">HH:MM:SS:FF</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Total Frames</div>
                    <div className="text-3xl font-bold text-white">
                      {timecodeResult.totalFrames.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">@ {frames} fps</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 bg-blue-500/10 border-blue-500/30">
            <h4 className="font-semibold text-blue-300 mb-2">Frame Rate Standards</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-white">Film: 23.976, 24 fps</div>
                <div className="text-white">NTSC: 29.97, 59.94 fps</div>
              </div>
              <div>
                <div className="text-white">PAL: 25, 50 fps</div>
                <div className="text-white">High Frame: 60, 120 fps</div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </ToolShell>
  );
}
