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

// -------------------
// Types & Constants
// -------------------
interface FrequencyEntry {
  id: string;
  device: string;
  frequency: number;
  band: string;
  notes: string;
}

const SAFE_SPACING_MHZ = 0.3;
const RANDOM_ID = () => Math.random().toString(36).slice(2, 10);

const TV_BANDS = [
  { name: "VHF Band I", range: "54–72 MHz" },
  { name: "VHF Band III", range: "174–216 MHz" },
  { name: "UHF Band IV/V", range: "470–698 MHz" },
];

const COMMON_BANDS = [
  { value: "vhf-low", label: "VHF Low (54–88 MHz)", min: 54, max: 88 },
  { value: "vhf-high", label: "VHF High (174–216 MHz)", min: 174, max: 216 },
  { value: "uhf", label: "UHF (470–698 MHz)", min: 470, max: 698 },
  { value: "900mhz", label: "900 MHz ISM (902–928 MHz)", min: 902, max: 928 },
  { value: "1800mhz", label: "1.8 GHz (1785–1805 MHz)", min: 1785, max: 1805 },
  { value: "2.4ghz", label: "2.4 GHz WiFi (2400–2483 MHz)", min: 2400, max: 2483 },
  { value: "5ghz", label: "5 GHz WiFi (5150–5850 MHz)", min: 5150, max: 5850 },
];

// -------------------
// Component
// -------------------
export default function RFCoordination() {
  const [entries, setEntries] = useState<FrequencyEntry[]>([]);
  const [deviceName, setDeviceName] = useState("");
  const [frequencyInput, setFrequencyInput] = useState("");
  const [selectedBand, setSelectedBand] = useState("uhf");

  // -------------------
  // Core logic helpers
  // -------------------
  const addEntry = () => {
    if (!deviceName.trim() || !frequencyInput) return;

    const freq = parseFloat(frequencyInput);
    if (isNaN(freq)) return;

    const band = COMMON_BANDS.find((b) => b.value === selectedBand);

    const newEntry: FrequencyEntry = {
      id: RANDOM_ID(),
      device: deviceName.trim(),
      frequency: freq,
      band: band?.label ?? selectedBand,
      notes: "",
    };

    setEntries((prev) =>
      [...prev, newEntry].sort((a, b) => a.frequency - b.frequency)
    );

    setDeviceName("");
    setFrequencyInput("");
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateNotes = (id: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, notes: value } : e))
    );
  };

  const findInterference = (freq: number, index: number) =>
    entries.filter(
      (e, i) => i !== index && Math.abs(e.frequency - freq) < SAFE_SPACING_MHZ
    );

  // -------------------
  // CSV handling
  // -------------------
  const exportCSV = () => {
    const header = ["Device", "Frequency (MHz)", "Band", "Notes"];
    const body = entries.map((e) =>
      [e.device, e.frequency, e.band, e.notes.replace(/,/g, ";")].join(",")
    );

    const blob = new Blob([header.join(",") + "\n" + body.join("\n")], {
      type: "text/csv",
    });

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
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || "";
      const lines = text.trim().split("\n").slice(1);

      const imported: FrequencyEntry[] = lines
        .map((line) => line.split(","))
        .map(([device, freq, band, notes]) => ({
          id: RANDOM_ID(),
          device: device?.trim() || "Unknown",
          frequency: parseFloat(freq),
          band: band?.trim() || "Unknown",
          notes: notes?.trim() || "",
        }))
        .filter((e) => !isNaN(e.frequency));

      setEntries((prev) =>
        [...prev, ...imported].sort((a, b) => a.frequency - b.frequency)
      );
    };

    reader.readAsText(file);
  };

  // -------------------
  // ToolShell persistence
  // -------------------
  const getCurrentState = () => ({ frequencies: entries });
  const onLoad = (data: any) => {
    if (data?.frequencies) {
      setEntries(data.frequencies);
    }
  };

  // -------------------
  // UI Start
  // -------------------
  return (
    <ToolShell
      toolId="rf-coordination"
      toolName="RF Coordination"
      getCurrentState={getCurrentState}
      onLoad={onLoad}
    >
      <div className="space-y-6">
        {/* Add Device */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Add Wireless Device
          </h3>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-4">
              <Label>Device Name</Label>
              <Input
                value={deviceName}
                placeholder="e.g., Handheld 1"
                onChange={(e) => setDeviceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
              />
            </div>

            <div className="col-span-3">
              <Label>Frequency (MHz)</Label>
              <Input
                type="number"
                step="0.001"
                value={frequencyInput}
                placeholder="e.g., 542.125"
                onChange={(e) => setFrequencyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEntry()}
              />
            </div>

            <div className="col-span-3">
              <Label>Band</Label>
              <Select value={selectedBand} onValueChange={setSelectedBand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select band" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_BANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 flex items-end">
              <Button onClick={addEntry} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!entries.length}
              onClick={exportCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              onClick={() => document.getElementById("csv-import")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
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

          <p className="text-sm text-gray-400">
            Total Devices:{" "}
            <span className="text-white font-semibold">{entries.length}</span>
          </p>
        </div>

        {/* TV Band Reference */}
        <Card className="p-4 bg-blue-500/10 border-blue-500/30">
          <h4 className="font-semibold text-blue-300 mb-2">TV Band Reference</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {TV_BANDS.map((band) => (
              <div key={band.name}>
                <p className="text-white">{band.name}</p>
                <p className="text-gray-400">{band.range}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Frequency Entries */}
        {entries.length ? (
          <div className="space-y-3">
            {entries.map((entry, idx) => {
              const interference = findInterference(entry.frequency, idx);

              return (
                <Card
                  key={entry.id}
                  className={`p-4 ${
                    interference.length
                      ? "border-yellow-500/50 bg-yellow-500/5"
                      : ""
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Device */}
                    <div className="col-span-3">
                      <p className="font-semibold text-white">{entry.device}</p>
                      <p className="text-sm text-gray-400">{entry.band}</p>
                    </div>

                    {/* Frequency */}
                    <div className="col-span-2">
                      <p className="text-xl font-mono text-cyan-400">
                        {entry.frequency.toFixed(3)}
                      </p>
                      <p className="text-xs text-gray-500">MHz</p>
                    </div>

                    {/* Notes */}
                    <div className="col-span-6">
                      {interference.length > 0 && (
                        <div className="flex items-start gap-2 mb-2 text-yellow-400 text-sm">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>
                            Warning: Too close to{" "}
                            {interference
                              .map((i) => `${i.device} (${i.frequency.toFixed(3)} MHz)`)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                      <Input
                        placeholder="Notes (optional)"
                        value={entry.notes}
                        onChange={(e) => updateNotes(entry.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Delete */}
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>No frequencies added yet</p>
            <p className="text-sm">Add wireless devices above to coordinate RF spectrum</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
