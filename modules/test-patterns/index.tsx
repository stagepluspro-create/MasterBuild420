"use client";

import { useState, useRef, useEffect } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Maximize, Grid3x3, Palette } from "lucide-react";

const PATTERNS = [
  { id: "smpte", name: "SMPTE Color Bars", description: "Standard broadcast test pattern" },
  { id: "grid", name: "Focus Grid", description: "Alignment and focus test" },
  { id: "checkerboard", name: "Checkerboard", description: "Pixel response test" },
  { id: "crosshatch", name: "Crosshatch", description: "Geometry test" },
  { id: "grayscale", name: "Grayscale Ramp", description: "Contrast and gamma test" },
];

export default function TestPatterns() {
  const [selectedPattern, setSelectedPattern] = useState("smpte");
  const [fullscreen, setFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawPattern(selectedPattern);
  }, [selectedPattern]);

  const drawPattern = (patternId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    switch (patternId) {
      case "smpte":
        drawSMPTE(ctx, w, h);
        break;
      case "grid":
        drawGrid(ctx, w, h);
        break;
      case "checkerboard":
        drawCheckerboard(ctx, w, h);
        break;
      case "crosshatch":
        drawCrosshatch(ctx, w, h);
        break;
      case "grayscale":
        drawGrayscale(ctx, w, h);
        break;
    }
  };

  const drawSMPTE = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const colors = [
      "#C0C0C0", // Gray
      "#C0C000", // Yellow
      "#00C0C0", // Cyan
      "#00C000", // Green
      "#C000C0", // Magenta
      "#C00000", // Red
      "#0000C0", // Blue
    ];

    const barWidth = w / 7;
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, 0, barWidth, h * 0.67);
    });

    const bottomColors = ["#0000C0", "#000000", "#C000C0", "#000000", "#00C0C0", "#000000", "#C0C0C0"];
    const bottomBarWidth = w / 7;
    bottomColors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * bottomBarWidth, h * 0.67, bottomBarWidth, h * 0.33);
    });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    const gridSize = 50;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  };

  const drawCheckerboard = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const squareSize = 40;
    for (let y = 0; y < h; y += squareSize) {
      for (let x = 0; x < w; x += squareSize) {
        ctx.fillStyle = ((x / squareSize) + (y / squareSize)) % 2 === 0 ? "#FFFFFF" : "#000000";
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
  };

  const drawCrosshatch = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;

    const spacing = 80;
    for (let x = 0; x <= w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    for (let x = spacing / 2; x <= w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = spacing / 2; y <= h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  const drawGrayscale = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const steps = 16;
    const stepWidth = w / steps;

    for (let i = 0; i < steps; i++) {
      const gray = Math.floor((i / (steps - 1)) * 255);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(i * stepWidth, 0, stepWidth, h);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const getCurrentState = () => ({ selectedPattern });
  const handleLoadPreset = (data: any) => {
    if (data.selectedPattern) setSelectedPattern(data.selectedPattern);
  };

  return (
    <ToolShell
      toolId="test-patterns"
      toolName="Test Patterns"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PATTERNS.map((pattern) => (
            <Card
              key={pattern.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedPattern === pattern.id ? "border-cyan-400 bg-cyan-500/10" : "hover:border-white/30"
              }`}
              onClick={() => setSelectedPattern(pattern.id)}
            >
              <div className="text-lg font-semibold text-white mb-1">{pattern.name}</div>
              <div className="text-xs text-gray-400">{pattern.description}</div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Pattern Preview</h3>
            <Button onClick={toggleFullscreen} variant="outline">
              <Maximize className="w-4 h-4 mr-2" />
              {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </Button>
          </div>
          <div className="bg-black rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="w-full h-auto"
              style={{ maxHeight: "60vh" }}
            />
          </div>
        </Card>

        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <h4 className="font-semibold text-blue-300 mb-2">Usage Tips</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
            <li>Use SMPTE bars for broadcast color calibration</li>
            <li>Focus Grid helps align projectors and displays</li>
            <li>Checkerboard tests pixel response and motion blur</li>
            <li>Crosshatch verifies geometry and edge alignment</li>
            <li>Grayscale Ramp tests contrast and gamma curves</li>
          </ul>
        </Card>
      </div>
    </ToolShell>
  );
}
