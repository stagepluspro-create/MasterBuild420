"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, RefreshCw, Image as ImageIcon } from "lucide-react";
import { LUTParser, LUT } from "./lut-parser";
import { LUTEngine } from "./lut-engine";
import { LUTGenerator, LUTAdjustments } from "./lut-generator";
import { testImages, loadImageFromDataUrl, loadImageToCanvas } from "./test-images";

export function LUTPreview() {
  const [currentLUT, setCurrentLUT] = useState<LUT | null>(null);
  const [selectedImage, setSelectedImage] = useState(testImages[0].id);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonPosition, setComparisonPosition] = useState(50);
  const [adjustments, setAdjustments] = useState<LUTAdjustments>({
    contrast: 1.0,
    gamma: 1.0,
    saturation: 1.0,
    brightness: 1.0,
    temperature: 1.0,
    tint: 1.0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTestImage(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    if (sourceImageRef.current && canvasRef.current) {
      applyLUTToCanvas();
    }
  }, [currentLUT, adjustments, showComparison, comparisonPosition]);

  const loadTestImage = async (imageId: string) => {
    const testImage = testImages.find(img => img.id === imageId);
    if (!testImage) return;

    try {
      const img = await loadImageFromDataUrl(testImage.dataUrl);
      sourceImageRef.current = img;
      applyLUTToCanvas();
    } catch (error) {
      console.error('Failed to load test image:', error);
    }
  };

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

        setCurrentLUT(lut);
      } catch (error) {
        console.error('Failed to parse LUT:', error);
        alert('Failed to parse LUT file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        sourceImageRef.current = img;
        applyLUTToCanvas();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const applyLUTToCanvas = () => {
    if (!canvasRef.current || !sourceImageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = sourceImageRef.current;
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let lut = currentLUT;
    const hasAdjustments = Object.values(adjustments).some(v => v !== 1.0);

    if (hasAdjustments) {
      const adjustmentLUT = LUTGenerator.generateAdjustmentLUT(adjustments, 33, 'Custom Adjustment');
      lut = adjustmentLUT;
    }

    if (lut) {
      const processedData = LUTEngine.applyLUTToImageData(imageData, lut);

      if (showComparison) {
        const splitX = Math.floor((comparisonPosition / 100) * canvas.width);
        ctx.putImageData(imageData, 0, 0);
        const rightPart = ctx.getImageData(splitX, 0, canvas.width - splitX, canvas.height);
        const rightProcessed = LUTEngine.applyLUTToImageData(rightPart, lut);
        ctx.putImageData(rightProcessed, splitX, 0);

        ctx.strokeStyle = '#00E8FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();
      } else {
        ctx.putImageData(processedData, 0, 0);
      }
    }
  };

  const generateCustomLUT = () => {
    const lut = LUTGenerator.generateAdjustmentLUT(adjustments, 33, 'Custom Adjustment');
    setCurrentLUT(lut);
  };

  const resetAdjustments = () => {
    setAdjustments({
      contrast: 1.0,
      gamma: 1.0,
      saturation: 1.0,
      brightness: 1.0,
      temperature: 1.0,
      tint: 1.0,
    });
    setCurrentLUT(null);
  };

  const downloadLUT = () => {
    if (!currentLUT) return;
    const cubeContent = LUTParser.exportCube(currentLUT);
    const blob = new Blob([cubeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentLUT.title || 'custom'}.cube`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lut-preview.png';
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadImage}>
                <Download className="mr-2 h-4 w-4" />
                Image
              </Button>
              <Button variant="outline" size="sm" onClick={downloadLUT} disabled={!currentLUT}>
                <Download className="mr-2 h-4 w-4" />
                LUT
              </Button>
            </div>
          </div>

          <div className="relative bg-black/50 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
            {showComparison && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64">
                <Slider
                  value={[comparisonPosition]}
                  onValueChange={([value]) => setComparisonPosition(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div className="mt-4">
            <Label className="text-sm text-gray-300">Test Image</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {testImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.id)}
                  className={`relative aspect-video rounded border-2 overflow-hidden transition-all ${
                    selectedImage === img.id
                      ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  title={img.name}
                >
                  <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="w-full"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Custom Image
            </Button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Adjustments</h3>
            <Button variant="ghost" size="sm" onClick={resetAdjustments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-300">Contrast: {adjustments.contrast.toFixed(2)}</Label>
              <Slider
                value={[adjustments.contrast]}
                onValueChange={([value]) => setAdjustments({ ...adjustments, contrast: value })}
                min={0.5}
                max={2.0}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Gamma: {adjustments.gamma.toFixed(2)}</Label>
              <Slider
                value={[adjustments.gamma]}
                onValueChange={([value]) => setAdjustments({ ...adjustments, gamma: value })}
                min={0.5}
                max={2.5}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Saturation: {adjustments.saturation.toFixed(2)}</Label>
              <Slider
                value={[adjustments.saturation]}
                onValueChange={([value]) => setAdjustments({ ...adjustments, saturation: value })}
                min={0}
                max={2.0}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Brightness: {adjustments.brightness.toFixed(2)}</Label>
              <Slider
                value={[adjustments.brightness]}
                onValueChange={([value]) => setAdjustments({ ...adjustments, brightness: value })}
                min={0.5}
                max={1.5}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Temperature: {adjustments.temperature.toFixed(2)}</Label>
              <Slider
                value={[adjustments.temperature]}
                onValueChange={([value]) => setAdjustments({ ...adjustments, temperature: value })}
                min={0.7}
                max={1.3}
                step={0.01}
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Tint: {adjustments.tint.toFixed(2)}</Label>
              <Slider
                value={[adjustments.tint]}
                onValueChange={([value]) => setAdjustments({ ...adjustments, tint: value })}
                min={0.7}
                max={1.3}
                step={0.01}
                className="mt-2"
              />
            </div>

            <Button onClick={generateCustomLUT} className="w-full">
              Generate Custom LUT
            </Button>
          </div>
        </Card>

        {currentLUT && (
          <Card className="p-4 bg-white/5 border-white/10">
            <h3 className="text-sm font-medium text-white mb-2">LUT Info</h3>
            <div className="space-y-1 text-sm text-gray-400">
              <div>Type: {currentLUT.type}</div>
              <div>Size: {currentLUT.size}x{currentLUT.size}x{currentLUT.size}</div>
              {currentLUT.title && <div>Title: {currentLUT.title}</div>}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
