"use client";

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  analyserData: Uint8Array | null;
  isActive: boolean;
  currentFrequency: number;
}

export function WaveformVisualizer({
  analyserData,
  isActive,
  currentFrequency,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = "rgba(5, 5, 16, 0.2)";
      ctx.fillRect(0, 0, width, height);

      if (!isActive || !analyserData) {
        ctx.strokeStyle = "rgba(0, 232, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#00E8FF");
      gradient.addColorStop(0.5, "#9B5CFF");
      gradient.addColorStop(1, "#FF008C");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const sliceWidth = width / analyserData.length;
      let x = 0;

      for (let i = 0; i < analyserData.length; i++) {
        const v = analyserData[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00E8FF";
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserData, isActive]);

  return (
    <div className="relative w-full bg-gradient-to-br from-black/40 to-black/20 rounded-lg border border-white/10 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-full"
        style={{ display: "block" }}
      />
      {isActive && currentFrequency > 0 && (
        <div className="absolute top-3 right-3 text-xs font-mono bg-black/60 px-3 py-1.5 rounded-full border border-cyan-500/30">
          <span className="text-cyan-300">{currentFrequency.toFixed(2)} Hz</span>
        </div>
      )}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No signal</p>
        </div>
      )}
    </div>
  );
}
