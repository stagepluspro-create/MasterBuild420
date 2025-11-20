"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase-browser"

const supabase = createClient();
import { deltaE, xyToRGB, hexToXY } from "@/lib/color-science";
import { Search } from "lucide-react";

interface Gel {
  id: string;
  manufacturer: string;
  code: string;
  name: string;
  cie_x: number;
  cie_y: number;
  transmission: number | null;
  hex_preview: string;
  notes: string | null;
}

export function GelReference() {
  const [gels, setGels] = useState<Gel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [manufacturer, setManufacturer] = useState<string>("all");
  const [targetHex, setTargetHex] = useState("#FF8C00");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGels();
  }, []);

  const loadGels = async () => {
    try {
      const { data, error } = await supabase
        .from("gels")
        .select("*")
        .order("manufacturer")
        .order("code");

      if (error) throw error;
      setGels(data || []);
    } catch (error) {
      console.error("Failed to load gels:", error);
    } finally {
      setLoading(false);
    }
  };

  const manufacturers = useMemo(() => {
    const unique = new Set(gels.map((g) => g.manufacturer));
    return ["all", ...Array.from(unique).sort()];
  }, [gels]);

  const filteredGels = useMemo(() => {
    return gels.filter((gel) => {
      const matchesSearch =
        searchQuery === "" ||
        gel.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gel.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMfr = manufacturer === "all" || gel.manufacturer === manufacturer;

      return matchesSearch && matchesMfr;
    });
  }, [gels, searchQuery, manufacturer]);

  const findClosestGels = () => {
    const targetXY = hexToXY(targetHex);
    if (!targetXY) return [];

    const withDistance = gels.map((gel) => ({
      gel,
      distance: deltaE({ x: gel.cie_x, y: gel.cie_y }, targetXY),
    }));

    return withDistance.sort((a, b) => a.distance - b.distance).slice(0, 5);
  };

  const closestGels = useMemo(() => findClosestGels(), [targetHex, gels]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Loading gel library...</p>
      </div>
    );
  }

  if (gels.length === 0) {
    return (
      <Card className="glass-panel border-white/10">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400 mb-4">No gels in database yet.</p>
          <p className="text-sm text-gray-500">
            Gel data will be available after initial setup.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/10">
        <CardHeader>
          <CardTitle>Find Closest Gel</CardTitle>
          <CardDescription>Match a target color to the nearest gel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="text"
              value={targetHex}
              onChange={(e) => setTargetHex(e.target.value)}
              placeholder="#FF8C00"
              className="font-mono flex-1"
            />
            <div
              className="w-16 h-10 rounded border-2 border-white/20"
              style={{ backgroundColor: targetHex }}
            />
          </div>

          {closestGels.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Closest matches (by ΔE CIE76):</p>
              <div className="space-y-2">
                {closestGels.map(({ gel, distance }) => (
                  <div
                    key={gel.id}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div
                      className="w-12 h-12 rounded border-2 border-white/20 flex-shrink-0"
                      style={{ backgroundColor: gel.hex_preview }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">
                        {gel.manufacturer} {gel.code}
                      </p>
                      <p className="text-sm text-gray-400 truncate">{gel.name}</p>
                    </div>
                    <Badge variant="outline">ΔE: {distance.toFixed(1)}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Lower ΔE values indicate closer color matches. ΔE &lt; 2 is generally imperceptible.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by code, name, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {manufacturers.map((mfr) => (
            <Button
              key={mfr}
              variant={manufacturer === mfr ? "default" : "outline"}
              size="sm"
              onClick={() => setManufacturer(mfr)}
            >
              {mfr === "all" ? "All" : mfr}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGels.map((gel) => (
          <Card key={gel.id} className="glass-panel border-white/10">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div
                  className="w-16 h-16 rounded border-2 border-white/20 flex-shrink-0"
                  style={{ backgroundColor: gel.hex_preview }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">
                    {gel.manufacturer} {gel.code}
                  </p>
                  <p className="text-sm text-gray-400 mb-2">{gel.name}</p>
                  <div className="text-xs space-y-1">
                    <p className="text-gray-500">
                      xy: ({gel.cie_x.toFixed(3)}, {gel.cie_y.toFixed(3)})
                    </p>
                    {gel.transmission !== null && (
                      <p className="text-gray-500">τ: {gel.transmission}%</p>
                    )}
                    {gel.notes && (
                      <p className="text-cyan-400 italic">{gel.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGels.length === 0 && (
        <Card className="glass-panel border-white/10">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No gels match your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
