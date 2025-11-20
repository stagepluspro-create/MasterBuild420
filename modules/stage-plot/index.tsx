"use client";

import React, { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Undo2, Redo2, ZoomIn, ZoomOut, Download, Copy,
  Music, Mic, Speaker, Monitor, Lightbulb, Box, User
} from "lucide-react";

interface PropItem {
  id: string;
  type: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  notes: string;
  color: string;
}

interface StageSetup {
  name: string;
  width: number;
  height: number;
  props: PropItem[];
  gridSize: number;
  snapToGrid: boolean;
  layers: { [key: string]: boolean };
}

const STAGE_PRESETS = [
  { label: "Custom", width: 10, height: 8 },
  { label: "Club Stage (6m × 4m)", width: 6, height: 4 },
  { label: "Medium Theatre (10m × 8m)", width: 10, height: 8 },
  { label: "Festival (15m × 10m)", width: 15, height: 10 },
  { label: "Small Venue (8m × 6m)", width: 8, height: 6 },
];

const PROP_LIBRARY = [
  {
    category: "Instruments",
    icon: Music,
    items: [
      { type: "drum_kit", label: "Drum Kit", width: 2, height: 2, color: "#FF6B6B" },
      { type: "keyboard", label: "Keyboard", width: 1.5, height: 0.8, color: "#4ECDC4" },
      { type: "guitar_amp", label: "Guitar Amp", width: 0.8, height: 0.8, color: "#FFE66D" },
      { type: "bass_amp", label: "Bass Amp", width: 1, height: 1, color: "#A8E6CF" },
      { type: "dj_booth", label: "DJ Booth", width: 2, height: 1.5, color: "#95E1D3" },
    ]
  },
  {
    category: "Microphones",
    icon: Mic,
    items: [
      { type: "mic_stand", label: "Mic Stand", width: 0.3, height: 0.3, color: "#00D9FF" },
      { type: "overhead_mic", label: "Overhead Mic", width: 0.4, height: 0.4, color: "#0099CC" },
      { type: "di_box", label: "DI Box", width: 0.3, height: 0.3, color: "#0077AA" },
    ]
  },
  {
    category: "Speakers",
    icon: Speaker,
    items: [
      { type: "main_speaker", label: "Main Speaker", width: 1, height: 1.5, color: "#FF9F1C" },
      { type: "sub_speaker", label: "Subwoofer", width: 1.2, height: 0.8, color: "#FF7F00" },
      { type: "side_fill", label: "Side Fill", width: 0.8, height: 1, color: "#FFB84D" },
    ]
  },
  {
    category: "Monitors",
    icon: Monitor,
    items: [
      { type: "wedge_monitor", label: "Wedge Monitor", width: 0.6, height: 0.4, color: "#9B59B6" },
      { type: "drum_monitor", label: "Drum Monitor", width: 0.5, height: 0.5, color: "#8E44AD" },
      { type: "sidefill_monitor", label: "Sidefill", width: 0.8, height: 0.6, color: "#BF40BF" },
    ]
  },
  {
    category: "Lighting",
    icon: Lightbulb,
    items: [
      { type: "par_light", label: "Par Light", width: 0.5, height: 0.5, color: "#F4D03F" },
      { type: "moving_head", label: "Moving Head", width: 0.6, height: 0.6, color: "#F7DC6F" },
      { type: "truss", label: "Truss", width: 3, height: 0.5, color: "#666666" },
    ]
  },
  {
    category: "Stage",
    icon: Box,
    items: [
      { type: "riser", label: "Riser", width: 2, height: 1.5, color: "#7F8C8D" },
      { type: "table", label: "Table", width: 1.5, height: 0.8, color: "#95A5A6" },
      { type: "power_dist", label: "Power Distro", width: 0.6, height: 0.4, color: "#E74C3C" },
    ]
  },
  {
    category: "Crew",
    icon: User,
    items: [
      { type: "performer", label: "Performer", width: 0.5, height: 0.5, color: "#3498DB" },
      { type: "tech_position", label: "Tech Position", width: 0.4, height: 0.4, color: "#2ECC71" },
    ]
  },
];

const GRID_SIZES = [0.25, 0.5, 1];

export default function StagePlot() {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [setup, setSetup] = useState<StageSetup>({
    name: "New Stage Plot",
    width: 10,
    height: 8,
    props: [],
    gridSize: 0.5,
    snapToGrid: true,
    layers: {
      Instruments: true,
      Microphones: true,
      Speakers: true,
      Monitors: true,
      Lighting: true,
      Stage: true,
      Crew: true,
    },
  });

  // keep a ref of the latest setup for mouse events (avoids stale closures)
  const setupRef = useRef<StageSetup>(setup);
  useEffect(() => {
    setupRef.current = setup;
  }, [setup]);

  const [selectedProp, setSelectedProp] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<StageSetup[]>([setup]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const pixelsPerMeter = 40 * zoom;

  // centralised history + state updater
  const updateSetup = (newSetup: StageSetup, replaceHistory = false) => {
    if (replaceHistory) {
      // replace current history (used for loading a preset)
      setHistory([newSetup]);
      setHistoryIndex(0);
      setSetup(newSetup);
      return;
    }

    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      const next = [...sliced, newSetup];
      setHistoryIndex(next.length - 1);
      return next;
    });

    setSetup(newSetup);
  };

  const addPropToStage = (item: any, category: string) => {
    const newProp: PropItem = {
      id: `prop-${Date.now()}-${Math.random()}`,
      type: item.type,
      category,
      x: setup.width / 4,
      y: setup.height / 4,
      width: item.width,
      height: item.height,
      rotation: 0,
      label: item.label,
      notes: "",
      color: item.color,
    };

    updateSetup({ ...setupRef.current, props: [...setupRef.current.props, newProp] });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSetup(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSetup(history[newIndex]);
    }
  };

  const deleteProp = (id: string) => {
    updateSetup({ ...setupRef.current, props: setupRef.current.props.filter((p) => p.id !== id) });
    setSelectedProp(null);
  };

  const updateProp = (id: string, updates: Partial<PropItem>) => {
    const newProps = setupRef.current.props.map((p) => (p.id === id ? { ...p, ...updates } : p));
    updateSetup({ ...setupRef.current, props: newProps });
  };

  const duplicateProp = (id: string) => {
    const prop = setupRef.current.props.find((p) => p.id === id);
    if (!prop) return;

    const newProp: PropItem = {
      ...prop,
      id: `prop-${Date.now()}-${Math.random()}`,
      x: Math.min(setupRef.current.width - prop.width, prop.x + 1),
      y: Math.min(setupRef.current.height - prop.height, prop.y + 1),
    };

    updateSetup({ ...setupRef.current, props: [...setupRef.current.props, newProp] });
  };

  const handlePropMouseDown = (e: React.MouseEvent, prop: PropItem) => {
    e.stopPropagation();
    setSelectedProp(prop.id);
    setDragging(prop.id);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = (e.clientX - rect.left) / pixelsPerMeter - prop.x;
      const offsetY = (e.clientY - rect.top) / pixelsPerMeter - prop.y;
      setDragOffset({ x: offsetX, y: offsetY });
    }
  };

  // While dragging we update local state for smooth UI, but we do NOT push history on every move.
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / pixelsPerMeter - dragOffset.x;
    const y = (e.clientY - rect.top) / pixelsPerMeter - dragOffset.y;

    const prop = setupRef.current.props.find((p) => p.id === dragging);
    if (!prop) return;

    let newX = Math.max(0, Math.min(setupRef.current.width - prop.width, x));
    let newY = Math.max(0, Math.min(setupRef.current.height - prop.height, y));

    if (setupRef.current.snapToGrid) {
      newX = Math.round(newX / setupRef.current.gridSize) * setupRef.current.gridSize;
      newY = Math.round(newY / setupRef.current.gridSize) * setupRef.current.gridSize;
    }

    // update visual state only
    setSetup((prev) => {
      const updated = {
        ...prev,
        props: prev.props.map((p) => (p.id === dragging ? { ...p, x: newX, y: newY } : p)),
      };
      setupRef.current = updated; // keep ref in sync
      return updated;
    });
  };

  // On mouse up we commit one history entry with the final position
  const handleMouseUp = () => {
    if (dragging) {
      // commit final state to history
      updateSetup(setupRef.current);
      setDragging(null);
    }
  };

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(setupRef.current, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${setupRef.current.name.replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const getCurrentState = () => setupRef.current;

  const handleLoadPreset = (data: any) => {
    if (data && data.props) {
      // replace history entirely so Load acts like a fresh file
      updateSetup(data, true);
    }
  };

  const selectedPropData = setup.props.find((p) => p.id === selectedProp) || null;

  return (
    <ToolShell
      toolId="stage-plot"
      toolName="Stage Plot Designer"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Input
            value={setup.name}
            onChange={(e) => updateSetup({ ...setupRef.current, name: e.target.value })}
            className="max-w-xs"
            placeholder="Stage Plot Name"
          />

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex === 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex === history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="outline">{Math.round(zoom * 100)}%</Badge>
            <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr_250px] gap-4">
          <Card className="glass-panel border-white/10 max-h-[600px] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-sm">Props Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROP_LIBRARY.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center gap-2 mb-2">
                    <category.icon className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-semibold text-xs">{category.category}</h4>
                  </div>
                  <div className="space-y-1">
                    {category.items.map((item: any) => (
                      <Button
                        key={item.type}
                        size="sm"
                        variant="outline"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => addPropToStage(item, category.category)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="glass-panel border-white/10 p-3">
              <div className="flex items-center gap-3 flex-wrap text-sm">
                <Select
                  value={`${setup.width}x${setup.height}`}
                  onValueChange={(v) => {
                    const preset = STAGE_PRESETS.find((p) => `${p.width}x${p.height}` === v);
                    if (preset) updateSetup({ ...setupRef.current, width: preset.width, height: preset.height });
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_PRESETS.map((preset) => (
                      <SelectItem key={preset.label} value={`${preset.width}x${preset.height}`}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={setup.gridSize.toString()}
                  onValueChange={(v) => updateSetup({ ...setupRef.current, gridSize: parseFloat(v) })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRID_SIZES.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}m grid
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setup.snapToGrid}
                    onChange={(e) => updateSetup({ ...setupRef.current, snapToGrid: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-xs">Snap</span>
                </label>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {Object.keys(setup.layers).map((layer) => (
                  <Badge
                    key={layer}
                    variant={setup.layers[layer] ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() =>
                      updateSetup({
                        ...setupRef.current,
                        layers: { ...setupRef.current.layers, [layer]: !setupRef.current.layers[layer] },
                      })
                    }
                  >
                    {layer}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card
              ref={canvasRef}
              className="glass-panel border-white/10 relative overflow-auto bg-black/30"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                height: "500px",
                backgroundImage: `
                  repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent ${pixelsPerMeter * setup.gridSize}px),
                  repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent ${pixelsPerMeter * setup.gridSize}px)
                `,
                backgroundSize: `${pixelsPerMeter * setup.gridSize}px ${pixelsPerMeter * setup.gridSize}px`,
              }}
            >
              <div
                style={{
                  width: `${setup.width * pixelsPerMeter}px`,
                  height: `${setup.height * pixelsPerMeter}px`,
                  position: "relative",
                  margin: "20px",
                  border: "2px solid rgba(0, 217, 255, 0.3)",
                  background: "rgba(0, 0, 0, 0.3)",
                }}
              >
                {setup.props
                  .filter((prop) => setup.layers[prop.category])
                  .map((prop) => (
                    <div
                      key={prop.id}
                      onMouseDown={(e) => handlePropMouseDown(e, prop)}
                      style={{
                        position: "absolute",
                        left: `${prop.x * pixelsPerMeter}px`,
                        top: `${prop.y * pixelsPerMeter}px`,
                        width: `${prop.width * pixelsPerMeter}px`,
                        height: `${prop.height * pixelsPerMeter}px`,
                        backgroundColor: prop.color,
                        border: selectedProp === prop.id ? "3px solid #00D9FF" : "2px solid rgba(255,255,255,0.3)",
                        borderRadius: "4px",
                        cursor: "move",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: "bold",
                        color: "#000",
                        padding: "2px",
                        textAlign: "center",
                        overflow: "hidden",
                        transform: `rotate(${prop.rotation}deg)`,
                        transition: dragging === prop.id ? "none" : "all 0.1s",
                        userSelect: "none",
                      }}
                    >
                      {prop.label}
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {selectedPropData && (
            <Card className="glass-panel border-white/10 max-h-[600px] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-sm">Inspector</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-400">Label</Label>
                  <Input
                    value={selectedPropData.label}
                    onChange={(e) => updateProp(selectedProp!, { label: e.target.value })}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Notes</Label>
                  <Input
                    value={selectedPropData.notes}
                    onChange={(e) => updateProp(selectedProp!, { notes: e.target.value })}
                    className="mt-1 h-8 text-sm"
                    placeholder="Power, specs..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-400">Width (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedPropData.width}
                      onChange={(e) => updateProp(selectedProp!, { width: parseFloat(e.target.value) || 0.5 })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Height (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedPropData.height}
                      onChange={(e) => updateProp(selectedProp!, { height: parseFloat(e.target.value) || 0.5 })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Rotation (°)</Label>
                  <Input
                    type="number"
                    value={selectedPropData.rotation}
                    onChange={(e) => updateProp(selectedProp!, { rotation: parseInt(e.target.value) || 0 })}
                    className="mt-1 h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-400">Color</Label>
                  <input
                    type="color"
                    value={selectedPropData.color}
                    onChange={(e) => updateProp(selectedProp!, { color: e.target.value })}
                    className="w-full h-10 mt-1 rounded border border-white/20"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => duplicateProp(selectedProp!)}>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  <Button size="sm" variant="destructive" className="h-8" onClick={() => deleteProp(selectedProp!)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Stage Plot</DialogTitle>
              <DialogDescription>Choose export format</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button className="w-full" onClick={() => { exportAsJSON(); setShowExportDialog(false); }}>
                Export as JSON
              </Button>
              <Button className="w-full" variant="outline" onClick={() => { window.print(); setShowExportDialog(false); }}>
                Print / Save as PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ToolShell>
  );
}
