"use client";

import { useRef, useEffect } from "react";
import type { PhysicsEngine } from "@/lib/haze-simulator/physics-engine";
import type { HazeMachine, HVACVent, LightFixture, Obstacle } from "@/lib/haze-simulator/types";

interface VenueCanvasProps {
  engine: PhysicsEngine | null;
  machines: HazeMachine[];
  vents: HVACVent[];
  fixtures: LightFixture[];
  obstacles: Obstacle[];
  visibilityMap: Float32Array | null;
  venueWidth: number;
  venueLength: number;
  venueHeight: number;
}

export function VenueCanvas({
  engine,
  machines,
  vents,
  fixtures,
  obstacles,
  visibilityMap,
  venueWidth,
  venueLength,
  venueHeight
}: VenueCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !engine) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    const grid = engine.getGrid();
    const gridSize = engine.getGridSize();

    const scaleX = width / gridSize.x;
    const scaleY = height / gridSize.y;

    const midZ = Math.floor(gridSize.z / 2);

    for (let y = 0; y < gridSize.y; y++) {
      for (let x = 0; x < gridSize.x; x++) {
        const idx = x + y * gridSize.x + midZ * gridSize.x * gridSize.y;
        const density = grid[idx];

        if (density > 0.01) {
          const alpha = Math.min(density, 1);
          const hue = 180 + (density * 60);

          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${alpha * 0.7})`;
          ctx.fillRect(x * scaleX, y * scaleY, scaleX + 1, scaleY + 1);
        }
      }
    }

    ctx.strokeStyle = '#ffffff20';
    ctx.strokeRect(0, 0, width, height);

    const toCanvasX = (x: number) => (x / venueWidth) * width;
    const toCanvasY = (y: number) => (y / venueLength) * height;

    for (const machine of machines) {
      const cx = toCanvasX(machine.position.x);
      const cy = toCanvasY(machine.position.y);

      ctx.fillStyle = machine.isActive ? '#00E8FF' : '#666';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = machine.isActive ? '#00E8FF80' : '#66666680';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('M', cx - 4, cy + 3);
    }

    for (const vent of vents) {
      const cx = toCanvasX(vent.position.x);
      const cy = toCanvasY(vent.position.y);

      const color = vent.type === 'supply' ? '#9B5CFF' : vent.type === 'return' ? '#FF008C' : '#FFD700';

      ctx.fillStyle = vent.isActive ? color : '#666';
      ctx.fillRect(cx - 6, cy - 6, 12, 12);

      ctx.strokeStyle = vent.isActive ? color + '80' : '#66666680';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - 10, cy - 10, 20, 20);

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('V', cx - 3, cy + 3);
    }

    for (const fixture of fixtures) {
      const cx = toCanvasX(fixture.position.x);
      const cy = toCanvasY(fixture.position.y);

      ctx.fillStyle = fixture.isActive ? '#FFD700' : '#666';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx + 7, cy + 4);
      ctx.lineTo(cx - 7, cy + 4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = fixture.isActive ? '#FFD70080' : '#66666680';
      ctx.lineWidth = 2;
      ctx.stroke();

      const beamLength = 80;
      const angle = (fixture.tiltAngle - 90) * Math.PI / 180;
      const ex = cx + Math.cos(angle) * beamLength;
      const ey = cy + Math.sin(angle) * beamLength;

      const gradient = ctx.createLinearGradient(cx, cy, ex, ey);
      gradient.addColorStop(0, fixture.isActive ? `${fixture.color}60` : '#66666620');
      gradient.addColorStop(1, '#00000000');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      const x = (width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

  }, [engine, machines, vents, fixtures, obstacles, visibilityMap]);

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full"
      />
      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm p-3 rounded-lg text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
          <span>Haze Machine</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-violet-400"></div>
          <span>HVAC Supply</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-magenta-400"></div>
          <span>HVAC Return</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
          <span>Light Fixture</span>
        </div>
      </div>
    </div>
  );
}
