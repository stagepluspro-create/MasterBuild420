"use client";

import { Card } from "@/components/ui/card";
import { PatchlistChannel, PatchlistCategory } from "@/lib/patchlist-service";
import { Badge } from "@/components/ui/badge";

interface SignalFlowDiagramProps {
  patchlistId: string;
  channels: PatchlistChannel[];
  categories: PatchlistCategory[];
}

export function SignalFlowDiagram({
  patchlistId,
  channels,
  categories,
}: SignalFlowDiagramProps) {
  const groupedChannels = categories.length > 0
    ? categories.reduce((acc, cat) => {
        acc[cat.name] = channels.filter((ch) => ch.category === cat.name);
        return acc;
      }, {} as { [key: string]: PatchlistChannel[] })
    : { Uncategorized: channels };

  return (
    <Card className="glass-panel border-white/10 p-6">
      <h3 className="text-lg font-semibold mb-6">Signal Flow Diagram</h3>

      <div className="space-y-8">
        {Object.entries(groupedChannels).map(([categoryName, categoryChannels]) => {
          const category = categories.find((c) => c.name === categoryName);

          return (
            <div key={categoryName} className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: category?.color || "#00D9FF" }}
                />
                <h4 className="font-semibold text-white">{categoryName}</h4>
                <Badge variant="outline">{categoryChannels.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Sources</p>
                  <div className="space-y-1">
                    {categoryChannels.map((ch) => (
                      <div
                        key={ch.id}
                        className="p-2 bg-white/5 rounded text-sm border-l-4"
                        style={{ borderLeftColor: category?.color || "#00D9FF" }}
                      >
                        <div className="font-semibold">{ch.channel_number}</div>
                        <div className="text-xs text-gray-400">{ch.source_name}</div>
                        {ch.physical_location && (
                          <div className="text-xs text-gray-500">📍 {ch.physical_location}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-6xl text-cyan-400/20">→</div>
                    <p className="text-xs text-gray-400">Snake/Stage Box</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Destinations</p>
                  <div className="space-y-1">
                    {categoryChannels.map((ch) => (
                      <div
                        key={ch.id}
                        className="p-2 bg-white/5 rounded text-sm border-r-4"
                        style={{ borderRightColor: category?.color || "#00D9FF" }}
                      >
                        <div className="font-semibold">
                          {ch.console_channel || "Unassigned"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {ch.destination || "Console Input"}
                        </div>
                        {ch.snake_input && (
                          <div className="text-xs text-gray-500">Snake: {ch.snake_input}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {channels.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Add channels to see signal flow diagram</p>
        </div>
      )}
    </Card>
  );
}
