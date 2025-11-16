"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { LUTParser, LUT, LUT3D } from "./lut-parser";
import { LUTEngine } from "./lut-engine";

export function LUTVisualizer() {
  const [currentLUT, setCurrentLUT] = useState<LUT3D | null>(null);
  const [sliceDepth, setSliceDepth] = useState(0.5);
  const [sliceAxis, setSliceAxis] = useState<'r' | 'g' | 'b'>('b');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentLUT) {
      const identityLUT = LUTEngine.createIdentityLUT(17);
      setCurrentLUT(identityLUT);
    }
  }, []);

  useEffect(() => {
    if (currentLUT) {
      renderLUTSlice();
    }
  }, [currentLUT, sliceDepth, sliceAxis]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      try {
        let lut: LUT;
        if (file.name.endsWith('.cube')) {
          lut = await LUTParser.parseCube(content);
        } else if (file.name.endsWith('.3dl')) {
          lut = await LUTParser.parse3dl(content);
        } else {
          alert('Unsupported file format. Please upload .cube or .3dl files.');
          return;
        }

        if (lut.type === '3D') {
          setCurrentLUT(lut);
        } else {
          alert('Only 3D LUTs can be visualized.');
        }
      } catch (error) {
        console.error('Failed to parse LUT:', error);
        alert('Failed to parse LUT file.');
      }
    };
    reader.readAsText(file);
  };

  const renderLUTSlice = () => {
    if (!canvasRef.current || !currentLUT) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const size = currentLUT.size;
    const cellSize = 16;
    canvas.width = size * cellSize;
    canvas.height = size * cellSize;

    const sliceIndex = Math.floor(sliceDepth * (size - 1));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let rgb: number[];

        if (sliceAxis === 'r') {
          rgb = currentLUT.data[y][x][sliceIndex];
        } else if (sliceAxis === 'g') {
          rgb = currentLUT.data[y][sliceIndex][x];
        } else {
          rgb = currentLUT.data[sliceIndex][y][x];
        }

        const r = Math.round(rgb[0] * 255);
        const g = Math.round(rgb[1] * 255);
        const b = Math.round(rgb[2] * 255);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size * cellSize, i * cellSize);
      ctx.stroke();
    }
  };

  const axisLabels = {
    r: { axis: 'Red', horizontal: 'Green', vertical: 'Blue' },
    g: { axis: 'Green', horizontal: 'Red', vertical: 'Blue' },
    b: { axis: 'Blue', horizontal: 'Red', vertical: 'Green' }
  };

  const labels = axisLabels[sliceAxis];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">2D LUT Slice Viewer</h3>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".cube,.3dl"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Load LUT
              </Button>
            </div>
          </div>

          <div className="relative bg-black/50 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="border border-white/10 rounded"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <div className="absolute top-2 left-2 text-xs text-gray-400">
              {labels.vertical} →
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {labels.horizontal} →
            </div>
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-gray-400">
              This view shows a 2D slice through the 3D LUT cube. Each cell represents the output color for a specific input RGB combination. The slice depth controls which layer of the cube is displayed along the selected axis.
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-medium text-white mb-4">Slice Controls</h3>

          <div className="space-y-6">
            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Slice Axis</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={sliceAxis === 'r' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSliceAxis('r')}
                  className={sliceAxis === 'r' ? 'bg-red-500/20 border-red-500' : ''}
                >
                  Red
                </Button>
                <Button
                  variant={sliceAxis === 'g' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSliceAxis('g')}
                  className={sliceAxis === 'g' ? 'bg-green-500/20 border-green-500' : ''}
                >
                  Green
                </Button>
                <Button
                  variant={sliceAxis === 'b' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSliceAxis('b')}
                  className={sliceAxis === 'b' ? 'bg-blue-500/20 border-blue-500' : ''}
                >
                  Blue
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-300 mb-2 block">
                Slice Depth: {(sliceDepth * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[sliceDepth]}
                onValueChange={([value]) => setSliceDepth(value)}
                min={0}
                max={1}
                step={0.01}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </Card>

        {currentLUT && (
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-medium text-white mb-3">LUT Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">{currentLUT.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size:</span>
                <span className="text-white">
                  {currentLUT.size}³ ({Math.pow(currentLUT.size, 3).toLocaleString()} entries)
                </span>
              </div>
              {currentLUT.title && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white">{currentLUT.title}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Current Slice:</span>
                <span className="text-white">
                  {labels.axis} = {Math.floor(sliceDepth * (currentLUT.size - 1))}
                </span>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-lg font-medium text-white mb-3">Understanding the View</h3>
          <div className="space-y-3 text-sm text-gray-400">
            <p>
              The visualization shows how the LUT transforms colors in a 2D plane at a specific depth through the 3D color cube.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Horizontal axis: {labels.horizontal} values (0-100%)</li>
              <li>Vertical axis: {labels.vertical} values (0-100%)</li>
              <li>Slice depth: {labels.axis} value (adjustable)</li>
            </ul>
            <p>
              An identity LUT (no color change) will show a smooth gradient. Color shifts indicate the LUT's transformation.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
