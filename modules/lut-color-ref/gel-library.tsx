"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Copy, CheckCircle } from "lucide-react";
import { gelDatabase, searchGels, getGelsByManufacturer, getGelsByCategory, findClosestGel, GelFilter } from "./gel-database";

export function GelLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterManufacturer, setFilterManufacturer] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedGel, setSelectedGel] = useState<GelFilter | null>(null);
  const [customRgb, setCustomRgb] = useState({ r: 255, g: 255, b: 255 });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const filteredGels = gelDatabase.filter(gel => {
    const matchesSearch = searchQuery === "" ||
      gel.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gel.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesManufacturer = filterManufacturer === "all" || gel.manufacturer === filterManufacturer;
    const matchesCategory = filterCategory === "all" || gel.category === filterCategory;

    return matchesSearch && matchesManufacturer && matchesCategory;
  });

  const handleFindClosest = () => {
    const closest = findClosestGel(customRgb);
    setSelectedGel(closest);
    setSearchQuery(closest.number);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Number or name..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Manufacturer</Label>
              <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  <SelectItem value="Roscolux">Roscolux</SelectItem>
                  <SelectItem value="Lee">Lee Filters</SelectItem>
                  <SelectItem value="Apollo">Apollo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-gray-300 mb-2 block">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="diffusion">Diffusion</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-gray-400 mb-2">
            Showing {filteredGels.length} of {gelDatabase.length} gels
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredGels.map((gel) => (
              <button
                key={gel.id}
                onClick={() => setSelectedGel(gel)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedGel?.id === gel.id
                    ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className="w-full h-20 rounded mb-2"
                  style={{ backgroundColor: gel.hex }}
                />
                <div className="text-left">
                  <div className="font-medium text-white text-sm">{gel.manufacturer} {gel.number}</div>
                  <div className="text-xs text-gray-400 truncate">{gel.name}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {selectedGel && (
          <Card className="p-4 bg-white/5 border-white/10">
            <div
              className="w-full h-32 rounded-lg mb-4"
              style={{ backgroundColor: selectedGel.hex }}
            />

            <h3 className="text-lg font-medium text-white mb-3">
              {selectedGel.manufacturer} {selectedGel.number}
            </h3>
            <p className="text-gray-300 mb-4">{selectedGel.name}</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Hex:</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono">{selectedGel.hex}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(selectedGel.hex, 'hex')}
                  >
                    {copiedField === 'hex' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">RGB:</span>
                <div className="flex items-center gap-2">
                  <code className="text-white font-mono">
                    {selectedGel.rgb.r}, {selectedGel.rgb.g}, {selectedGel.rgb.b}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(`${selectedGel.rgb.r},${selectedGel.rgb.g},${selectedGel.rgb.b}`, 'rgb')}
                  >
                    {copiedField === 'rgb' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Transmission:</span>
                <span className="text-white">{selectedGel.transmission}%</span>
              </div>

              {selectedGel.cct && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">CCT:</span>
                  <span className="text-white">{selectedGel.cct}K</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Category:</span>
                <span className="text-white capitalize">{selectedGel.category}</span>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 bg-white/5 border-white/10">
          <h3 className="text-sm font-medium text-white mb-3">Find Closest Gel</h3>
          <p className="text-xs text-gray-400 mb-4">
            Enter RGB values to find the closest matching gel filter.
          </p>

          <div className="space-y-3">
            <div>
              <Label className="text-sm text-gray-300">Red (0-255)</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={customRgb.r}
                onChange={(e) => setCustomRgb({ ...customRgb, r: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Green (0-255)</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={customRgb.g}
                onChange={(e) => setCustomRgb({ ...customRgb, g: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Blue (0-255)</Label>
              <Input
                type="number"
                min="0"
                max="255"
                value={customRgb.b}
                onChange={(e) => setCustomRgb({ ...customRgb, b: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div
              className="w-full h-16 rounded"
              style={{ backgroundColor: `rgb(${customRgb.r}, ${customRgb.g}, ${customRgb.b})` }}
            />

            <Button onClick={handleFindClosest} className="w-full">
              Find Closest Match
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
