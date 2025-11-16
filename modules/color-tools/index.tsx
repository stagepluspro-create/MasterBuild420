"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cctToRGB } from "@/lib/color-science";

const GEL_DATABASE = [
  { id: "R02", name: "Bastard Amber", brand: "Roscolux", category: "Amber", hex: "#FFC966" },
  { id: "R09", name: "Pale Amber Gold", brand: "Roscolux", category: "Amber", hex: "#FFDB99" },
  { id: "R15", name: "Deep Straw", brand: "Roscolux", category: "Amber", hex: "#FFE14D" },
  { id: "R26", name: "Light Red", brand: "Roscolux", category: "Red", hex: "#FF6B6B" },
  { id: "R33", name: "No Color Pink", brand: "Roscolux", category: "Pink", hex: "#FFB5CC" },
  { id: "R54", name: "Special Lavender", brand: "Roscolux", category: "Lavender", hex: "#C4A1D9" },
  { id: "R60", name: "No Color Blue", brand: "Roscolux", category: "Blue", hex: "#B8D8E8" },
  { id: "R64", name: "Light Steel Blue", brand: "Roscolux", category: "Blue", hex: "#7FB3CC" },
  { id: "R79", name: "Just Blue", brand: "Roscolux", category: "Blue", hex: "#5A9FCC" },
  { id: "R80", name: "Primary Blue", brand: "Roscolux", category: "Blue", hex: "#3D7DA6" },
  { id: "R92", name: "Turquoise", brand: "Roscolux", category: "Green", hex: "#4FC4C4" },
  { id: "L201", name: "Full C.T. Blue", brand: "Lee", category: "Blue", hex: "#7FB3D9" },
  { id: "L202", name: "Half C.T. Blue", brand: "Lee", category: "Blue", hex: "#B8D6E8" },
  { id: "L204", name: "Full C.T. Orange", brand: "Lee", category: "Orange", hex: "#FFA64D" },
  { id: "L205", name: "Half C.T. Orange", brand: "Lee", category: "Orange", hex: "#FFCC99" },
  { id: "L250", name: "Half White Diffusion", brand: "Lee", category: "Diffusion", hex: "#F5F5F5" },
];

const CCT_PRESETS = [
  { name: "Candlelight", kelvin: 1850 },
  { name: "Tungsten", kelvin: 2800 },
  { name: "Warm White LED", kelvin: 3200 },
  { name: "Daylight", kelvin: 5600 },
  { name: "Overcast Sky", kelvin: 6500 },
  { name: "Clear Sky", kelvin: 10000 },
];

export default function ColorTools() {
  const [searchGel, setSearchGel] = useState("");
  const [selectedGel, setSelectedGel] = useState<typeof GEL_DATABASE[0] | null>(null);
  const [cctInput, setCctInput] = useState("5600");
  const [cctResult, setCctResult] = useState<{ r: number; g: number; b: number } | null>(null);

  const filteredGels = GEL_DATABASE.filter(
    (gel) =>
      gel.name.toLowerCase().includes(searchGel.toLowerCase()) ||
      gel.id.toLowerCase().includes(searchGel.toLowerCase()) ||
      gel.category.toLowerCase().includes(searchGel.toLowerCase())
  );

  const convertCCT = () => {
    const kelvin = parseFloat(cctInput);
    if (kelvin >= 1000 && kelvin <= 40000) {
      const result = cctToRGB(kelvin);
      setCctResult(result.rgb);
    }
  };

  const getCurrentState = () => ({ cctInput, selectedGelId: selectedGel?.id });

  const handleLoadPreset = (data: any) => {
    if (data.cctInput) setCctInput(data.cctInput);
    if (data.selectedGelId) {
      const gel = GEL_DATABASE.find((g) => g.id === data.selectedGelId);
      if (gel) setSelectedGel(gel);
    }
  };

  return (
    <ToolShell
      toolId="color-tools"
      toolName="Color Tools"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <Tabs defaultValue="gel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gel">Gel Reference</TabsTrigger>
          <TabsTrigger value="cct">CCT Converter</TabsTrigger>
        </TabsList>

        <TabsContent value="gel" className="space-y-6 mt-6">
          <Card className="p-6">
            <Label>Search Gels</Label>
            <Input
              value={searchGel}
              onChange={(e) => setSearchGel(e.target.value)}
              placeholder="Search by name, ID, or category..."
              className="mt-2"
            />
          </Card>

          {selectedGel && (
            <Card className="p-6">
              <div className="flex items-start gap-6">
                <div
                  className="w-32 h-32 rounded-lg border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: selectedGel.hex }}
                />
                <div className="flex-1">
                  <div className="text-2xl font-bold text-white mb-1">{selectedGel.name}</div>
                  <div className="text-lg text-gray-400 mb-4">
                    {selectedGel.id} • {selectedGel.brand}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Category</div>
                      <div className="text-white font-semibold">{selectedGel.category}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Hex Code</div>
                      <div className="text-white font-mono">{selectedGel.hex}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGels.map((gel) => (
              <Card
                key={gel.id}
                className={`p-4 cursor-pointer transition-all hover:border-cyan-400 ${
                  selectedGel?.id === gel.id ? "border-cyan-400 bg-cyan-500/10" : ""
                }`}
                onClick={() => setSelectedGel(gel)}
              >
                <div
                  className="w-full h-20 rounded-lg border border-white/20 mb-3"
                  style={{ backgroundColor: gel.hex }}
                />
                <div className="font-semibold text-white text-sm truncate">{gel.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {gel.id} • {gel.brand}
                </div>
              </Card>
            ))}
          </div>

          {filteredGels.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No gels match your search</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cct" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Color Temperature Converter</h3>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8">
                <Label>Kelvin Temperature</Label>
                <Input
                  type="number"
                  value={cctInput}
                  onChange={(e) => setCctInput(e.target.value)}
                  placeholder="e.g., 5600"
                  min="1000"
                  max="40000"
                  onKeyDown={(e) => e.key === "Enter" && convertCCT()}
                />
                <div className="text-xs text-gray-400 mt-1">Range: 1000K - 40000K</div>
              </div>
              <div className="col-span-4 flex items-end">
                <Button onClick={convertCCT} className="w-full">
                  Convert
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {CCT_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCctInput(preset.kelvin.toString());
                    const result = cctToRGB(preset.kelvin);
                    setCctResult(result.rgb);
                  }}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </Card>

          {cctResult && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Result: {cctInput}K Color Temperature
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div
                    className="w-full h-48 rounded-lg border-2 border-white/20 shadow-lg"
                    style={{
                      backgroundColor: `rgb(${cctResult.r}, ${cctResult.g}, ${cctResult.b})`,
                    }}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">RGB Values</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-red-400 font-semibold">Red:</span>
                        <span className="text-white font-mono">{cctResult.r}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-400 font-semibold">Green:</span>
                        <span className="text-white font-mono">{cctResult.g}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400 font-semibold">Blue:</span>
                        <span className="text-white font-mono">{cctResult.b}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Hex Code</div>
                    <div className="text-white font-mono text-lg">
                      #
                      {cctResult.r.toString(16).padStart(2, "0").toUpperCase()}
                      {cctResult.g.toString(16).padStart(2, "0").toUpperCase()}
                      {cctResult.b.toString(16).padStart(2, "0").toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">CSS RGB</div>
                    <div className="text-white font-mono text-sm">
                      rgb({cctResult.r}, {cctResult.g}, {cctResult.b})
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4 bg-blue-500/10 border-blue-500/30">
            <h4 className="font-semibold text-blue-300 mb-2">Common Color Temperatures</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {CCT_PRESETS.map((preset) => (
                <div key={preset.name}>
                  <div className="text-white">{preset.name}</div>
                  <div className="text-gray-400">{preset.kelvin}K</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </ToolShell>
  );
}
