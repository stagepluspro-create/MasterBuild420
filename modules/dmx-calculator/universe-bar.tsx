"use client";

import { DMXFixture } from "@/lib/dmx-service";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UniverseBarProps {
  universeNumber: number;
  universeName?: string;
  fixtures: DMXFixture[];
  selectedFixtureId?: string;
  onFixtureClick?: (fixture: DMXFixture) => void;
}

export function UniverseBar({
  universeNumber,
  universeName,
  fixtures,
  selectedFixtureId,
  onFixtureClick,
}: UniverseBarProps) {
  const sortedFixtures = [...fixtures].sort(
    (a, b) => a.start_address - b.start_address
  );

  const totalChannels = fixtures.reduce((sum, f) => sum + f.channel_count, 0);
  const usagePercent = (totalChannels / 512) * 100;

  const getFixtureWidth = (fixture: DMXFixture) => {
    return (fixture.channel_count / 512) * 100;
  };

  const getFixtureLeft = (fixture: DMXFixture) => {
    return ((fixture.start_address - 1) / 512) * 100;
  };

  const getGroupColor = (color?: string) => {
    return color || "#00E8FF";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            Universe {universeNumber}
          </h3>
          {universeName && (
            <span className="text-xs text-gray-400">{universeName}</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-400">
            {fixtures.length} fixture{fixtures.length !== 1 ? "s" : ""}
          </span>
          <span
            className={cn(
              "font-mono",
              usagePercent > 90
                ? "text-red-400"
                : usagePercent > 70
                ? "text-amber-400"
                : "text-cyan-400"
            )}
          >
            {totalChannels} / 512 ch ({usagePercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="relative h-12 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <TooltipProvider delayDuration={100}>
          {sortedFixtures.map((fixture) => (
            <Tooltip key={fixture.id}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "absolute h-full transition-all cursor-pointer",
                    "border-r border-black/20",
                    "hover:brightness-125",
                    selectedFixtureId === fixture.id && "ring-2 ring-white ring-inset"
                  )}
                  style={{
                    left: `${getFixtureLeft(fixture)}%`,
                    width: `${getFixtureWidth(fixture)}%`,
                    backgroundColor: getGroupColor(fixture.group_color),
                    opacity: 0.8,
                  }}
                  onClick={() => onFixtureClick?.(fixture)}
                >
                  <div className="h-full flex items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-black truncate">
                      {fixture.fixture_name}
                    </span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{fixture.fixture_name}</p>
                  {fixture.fixture_type && (
                    <p className="text-xs text-gray-400">{fixture.fixture_type}</p>
                  )}
                  <div className="text-xs space-y-0.5">
                    <p>
                      Address: {fixture.start_address} - {fixture.end_address}
                    </p>
                    <p>Channels: {fixture.channel_count}</p>
                    {fixture.mode_name && <p>Mode: {fixture.mode_name}</p>}
                    {fixture.group_name && (
                      <p className="text-cyan-400">Group: {fixture.group_name}</p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>

        <div className="absolute inset-x-0 bottom-0 h-px flex">
          {[0, 128, 256, 384, 512].map((channel) => (
            <div
              key={channel}
              className="absolute bottom-0 h-2 border-l border-white/20"
              style={{ left: `${(channel / 512) * 100}%` }}
            >
              <span className="absolute -bottom-5 left-0 text-[10px] text-gray-500 -translate-x-1/2">
                {channel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
