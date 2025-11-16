"use client";

import { useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, AlertTriangle, Download, Upload } from "lucide-react";

interface Frequency {
  id: string;
  device: string;
  frequency: number;
  band: string;
  notes: string;
}

const TV_BANDS = [
  { name: "VHF Band I", range: "54-72 MHz" },
  { name: "VHF Band III", range: "174-216 MHz" },
  { name: "UHF Band IV/V", range: "470-698 MHz" },
];

const COMMON_BANDS = [
  { value: "vhf-low", label: "VHF Low (54-88 MHz)", min: 54, max: 88 },
  { value: "vhf-high", label: "VHF High (174-216 MHz)", min: 174, max: 216 },
  { value: "uhf", label: "UHF (470-698 MHz)", min: 470, max: 698 },
  { value: "900mhz", label: "900 MHz ISM", min: 902, max: 928 },
  { value: "1800mhz", label: "1.8 GHz", min: 1785, max: 1805 },
  { value: "2.4ghz", label: "2.4 GHz WiFi", min: 2400, max: 2483 },
  { value: "5ghz", label: "5 GHz WiFi", min: 5150, max: 5850 },
];

export default function RFCoordination() {
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [newDevice, setNewDevice] = useState("");
  const [newFrequency, setNewFrequency] = useState("");
  const [selectedBand, setSelectedBand] = useState("uhf");

  const addFrequency = () => {
    if (!newDevice.trim() || !newFrequency) return;

    const freq = parseFloat(newFrequency);
    if (isNaN(freq)) return;

    const band = COMMON_BANDS.find((b) => b.value === selectedBand);

    const newFreq: Frequency = {
      id: Math.random().toString(36).substr(2, 9),
      device: newDevice,
      frequency: freq,
      band: band?.label || selectedBand,
      notes: "",
    };

    setFrequencies([...frequencies, newFreq].sort((a, b) => a.frequency - b.frequency));
    setNewDevice("");
    setNewFrequency("");
  };

  const deleteFrequency = (id: string) => {
    setFrequencies(frequencies.filter((f) => f.id !== id));
  };

  const updateNotes = (id: string, notes: string) => {
    setFrequencies(frequencies.map((f) => (f.id === id ? { ...f, notes } : f)));
  };

  const checkInterference = (freq: number, index: number) => {
    const SAFE_SPACING = 0.3;
    const nearby = frequencies.filter((f, i) => i !== index && Math.abs(f.frequency - freq) < SAFE_SPACING);
    return nearby.length > 0 ? nearby : null;
  };

  const exportCSV = () => {
    const csv = [
      ["Device", "Frequency (MHz)", "Band", "Notes"].join(","),
      ...frequencies.map((f) => [f.device, f.frequency, f.band, f.notes.replace(/,/g, ";")].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rf-plan-${Date.now()}.csv`;
    a.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1);
      const imported: Frequency[] = [];

      lines.forEach((line) => {
        const [device, freq, band, notes] = line.split(",");
        if (device && freq) {
          imported.push({
            id: Math.random().toString(36).substr(2, 9),
            device: device.trim(),
            frequency: parseFloat(freq),
            band: band?.trim() || "Unknown",
            notes: notes?.trim() || "",
          });
        }
      });

      setFrequencies([...frequencies, ...imported].sort((a, b) => a.frequency - b.frequency));
    };
    reader.readAsText(file);
  };

  const getCurrentState = () => ({ frequencies });

  const handleLoadPreset = (data: any) => {
    if (data.frequencies) {
      setFrequencies(data.frequencies);
    }
  };

  return (
    <ToolShell
      toolId="rf-coordination"
      toolName="RF Coordination"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Add Wireless Device</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <Label>Device Name</Label>
              <Input
                value={newDevice}
                onChange={(e) => setNewDevice(e.target.value)}
                placeholder="e.g., Handheld 1"
                onKeyDown={(e) => e.key === "Enter" && addFrequency()}
              />
            </div>
            <div className="col-span-3">
              <Label>Frequency (MHz)</Label>
              <Input
                type="number"
                step="0.001"
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                placeholder="e.g., 542.125"
                onKeyDown={(e) => e.key === "Enter" && addFrequency()}
              />
            </div>
            <div className="col-span-3">
              <Label>Band</Label>
              <Select value={selectedBand} onValueChange={setSelectedBand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_BANDS.map((band) => (
                    <SelectItem key={band.value} value={band.value}>
                      {band.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-end">
              <Button onClick={addFrequency} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" disabled={frequencies.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => document.getElementById("csv-import")?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <input
              id="csv-import"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={importCSV}
            />
          </div>
          <div className="text-sm text-gray-400">
            Total Devices: <span className="text-white font-bold">{frequencies.length}</span>
          </div>
        </div>

        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <h4 className="font-semibold text-blue-300 mb-2">TV Band Reference</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {TV_BANDS.map((band) => (
              <div key={band.name}>
                <div className="text-white">{band.name}</div>
                <div className="text-gray-400">{band.range}</div>
              </div>
            ))}
          </div>
        </Card>

        {frequencies.length > 0 && (
          <div className="space-y-2">
            {frequencies.map((freq, index) => {
              const interference = checkInterference(freq.frequency, index);
              return (
                <Card
                  key={freq.id}
                  className={interference ? "p-4 border-yellow-500/50 bg-yellow-500/5" : "p-4"}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="font-semibold text-white">{freq.device}</div>
                      <div className="text-sm text-gray-400">{freq.band}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xl font-mono text-cyan-400">{freq.frequency.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">MHz</div>
                    </div>
                    <div className="col-span-6">
                      {interference && (
                        <div className="flex items-start gap-2 mb-2 text-yellow-400 text-sm">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            Warning: Too close to {interference.map((f) => f.device).join(", ")} (
                            {interference.map((f) => f.frequency.toFixed(3)).join(", ")} MHz)
                          </span>
                        </div>
                      )}
                      <Input
                        placeholder="Notes (optional)"
                        value={freq.notes}
                        onChange={(e) => updateNotes(freq.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteFrequency(freq.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {frequencies.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No frequencies added yet</p>
            <p className="text-sm">Add wireless devices above to coordinate RF spectrum</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
