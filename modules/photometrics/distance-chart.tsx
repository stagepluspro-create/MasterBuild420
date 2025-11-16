"use client";

import { Card } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface DistanceChartProps {
  units: "metric" | "imperial";
  cbcp: number;
  maxDistance: number;
}

export function DistanceChart({ units, cbcp, maxDistance }: DistanceChartProps) {
  const distanceUnit = units === "metric" ? "m" : "ft";

  const points = 50;
  const step = maxDistance / points;

  const dataPoints = Array.from({ length: points }, (_, i) => {
    const distance = (i + 1) * step;
    const distanceInMeters = units === "metric" ? distance : distance * 0.3048;
    const lux = cbcp / (distanceInMeters * distanceInMeters);
    return { distance, lux };
  });

  const maxLux = Math.max(...dataPoints.map(p => p.lux));
  const chartHeight = 200;

  const referenceLines = [
    { value: 10000, label: "Daylight", color: "yellow" },
    { value: 2000, label: "Theatrical", color: "cyan" },
    { value: 800, label: "Key Light", color: "violet" },
    { value: 200, label: "Wash", color: "magenta" },
  ].filter(line => line.value < maxLux);

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold">Illuminance vs Distance (Inverse Square Law)</h3>
      </div>

      <div className="relative" style={{ height: `${chartHeight + 60}px` }}>
        <svg
          width="100%"
          height={chartHeight + 40}
          className="overflow-visible"
          viewBox={`0 0 600 ${chartHeight + 40}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(0, 232, 255)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(155, 92, 255)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(255, 0, 140)" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {referenceLines.map((line) => {
            const y = chartHeight - (line.value / maxLux) * chartHeight;
            return (
              <g key={line.label}>
                <line
                  x1="0"
                  y1={y}
                  x2="600"
                  y2={y}
                  stroke={`var(--${line.color}-400, #888)`}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
                <text
                  x="5"
                  y={y - 4}
                  fill={`var(--${line.color}-300, #aaa)`}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {line.label} ({line.value.toLocaleString()} lux)
                </text>
              </g>
            );
          })}

          <path
            d={`M 0 ${chartHeight} ${dataPoints
              .map((p, i) => {
                const x = (i / points) * 600;
                const y = chartHeight - (p.lux / maxLux) * chartHeight;
                return `L ${x} ${y}`;
              })
              .join(" ")} L 600 ${chartHeight} Z`}
            fill="url(#areaGradient)"
          />

          <polyline
            points={dataPoints
              .map((p, i) => {
                const x = (i / points) * 600;
                const y = chartHeight - (p.lux / maxLux) * chartHeight;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="url(#areaGradient)"
            strokeWidth="2"
          />

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const x = fraction * 600;
            const distance = fraction * maxDistance;
            return (
              <g key={fraction}>
                <line
                  x1={x}
                  y1={chartHeight}
                  x2={x}
                  y2={chartHeight + 5}
                  stroke="#888"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={chartHeight + 18}
                  fill="#888"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {distance.toFixed(0)}
                </text>
              </g>
            );
          })}

          <text
            x="300"
            y={chartHeight + 35}
            fill="#aaa"
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
          >
            Distance ({distanceUnit})
          </text>
        </svg>
      </div>

      <div className="mt-6 grid md:grid-cols-4 gap-4 text-xs">
        {[0.25, 0.5, 0.75, 1].map((fraction) => {
          const distance = fraction * maxDistance;
          const distanceInMeters = units === "metric" ? distance : distance * 0.3048;
          const lux = cbcp / (distanceInMeters * distanceInMeters);
          return (
            <div key={fraction} className="p-3 bg-white/5 rounded border border-white/10">
              <p className="text-gray-400 mb-1">
                @ {distance.toFixed(1)} {distanceUnit}
              </p>
              <p className="text-lg font-bold gradient-text">
                {lux.toFixed(0)} lux
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded">
        <p className="text-xs text-cyan-300">
          <strong>Inverse Square Law:</strong> Illuminance drops with the square of distance.
          Doubling distance reduces illuminance to 1/4 (−2 stops). Halving distance increases it 4× (+2 stops).
        </p>
      </div>
    </Card>
  );
}
