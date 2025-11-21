"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FixtureMapping } from "@/lib/console-translator/types";

interface MappingTableProps {
  mappings: FixtureMapping[];
}

export function MappingTable({ mappings }: MappingTableProps) {
  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-cyan-500">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Fixture Mappings</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-2">Fixture ID</th>
              <th className="text-left p-2">Source</th>
              <th className="text-left p-2">Target</th>
              <th className="text-left p-2">Address</th>
              <th className="text-left p-2">Channels</th>
              <th className="text-left p-2">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {mappings.slice(0, 20).map((mapping, idx) => (
              <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="p-2 text-gray-400">{mapping.fixtureId}</td>
                <td className="p-2">
                  <div className="text-xs">
                    <div className="font-semibold">{mapping.sourceManufacturer}</div>
                    <div className="text-gray-400">{mapping.sourceModel}</div>
                    {mapping.sourceMode && <div className="text-gray-500">{mapping.sourceMode}</div>}
                  </div>
                </td>
                <td className="p-2">
                  <div className="text-xs">
                    <div className="font-semibold">{mapping.targetManufacturer}</div>
                    <div className="text-gray-400">{mapping.targetModel}</div>
                    {mapping.targetMode && <div className="text-gray-500">{mapping.targetMode}</div>}
                  </div>
                </td>
                <td className="p-2 text-gray-400">
                  {mapping.targetAddress
                    ? `${mapping.targetAddress.universe}.${mapping.targetAddress.address}`
                    : 'N/A'}
                </td>
                <td className="p-2 text-gray-400">{mapping.channelMaps.length}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {getConfidenceBadge(mapping.confidenceScore)}
                    <span className="text-xs text-gray-400">{mapping.confidenceScore.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mappings.length > 20 && (
          <div className="text-center text-sm text-gray-400 mt-4">
            Showing 20 of {mappings.length} mappings
          </div>
        )}
      </div>
    </Card>
  );
}
