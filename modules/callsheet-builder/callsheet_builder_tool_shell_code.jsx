"use client";

import React, { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table";
import { Trash2, Plus, Download, Printer, Save } from "lucide-react";

// Callsheet Builder - ToolShell compatible React component
// Safe for production deployment (client-side only)
// Uses localStorage for presets and ToolShell getCurrentState/onLoad for integration

const SAMPLE_BG = "/mnt/data/Screenshot 2025-11-20 204756.png"; // developer-supplied path; your build will map this to an URL

type CrewMember = { id: string; name: string; role: string; contact?: string; callTime?: string };
type CastMember = { id: string; name: string; character?: string; callTime?: string; wardrobe?: string };

type Scene = { id: string; sceneNumber: string; pages?: string; location?: string; notes?: string };

type Callsheet = {
  title: string;
  production: string;
  date: string; // ISO date
  callTime: string; // e.g. 06:30
  location: string;
  address?: string;
  weather?: string;
  notes?: string;
  crew: CrewMember[];
  cast: CastMember[];
  scenes: Scene[];
};

const STORAGE_KEY = "stp-callsheet-presets-v1";

const uid = () => Math.random().toString(36).slice(2, 9);

export default function CallsheetBuilder() {
  const [title, setTitle] = useState("Day Callsheet");
  const [production, setProduction] = useState("Production Name");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [callTime, setCallTime] = useState("06:30");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [weather, setWeather] = useState("");
  const [notes, setNotes] = useState("");

  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);

  const [presets, setPresets] = useState<Callsheet[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const printableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // keep UI-friendly defaults
  }, []);

  // ToolShell integration
  const getCurrentState = () => ({ title, production, date, callTime, location, address, weather, notes, crew, cast, scenes });
  const onLoad = (data: any) => {
    if (!data) return;
    if (data.title) setTitle(data.title);
    if (data.production) setProduction(data.production);
    if (data.date) setDate(data.date);
    if (data.callTime) setCallTime(data.callTime);
    if (data.location) setLocation(data.location);
    if (data.address) setAddress(data.address);
    if (data.weather) setWeather(data.weather);
    if (data.notes) setNotes(data.notes);
    if (Array.isArray(data.crew)) setCrew(data.crew);
    if (Array.isArray(data.cast)) setCast(data.cast);
    if (Array.isArray(data.scenes)) setScenes(data.scenes);
  };

  // CRUD helpers
  const addCrew = (over?: Partial<CrewMember>) => {
    setCrew((c) => [...c, { id: uid(), name: over?.name || "", role: over?.role || "", contact: over?.contact || "", callTime: over?.callTime || "" }]);
  };
  const updateCrew = (id: string, patch: Partial<CrewMember>) => setCrew((c) => c.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeCrew = (id: string) => setCrew((c) => c.filter((m) => m.id !== id));

  const addCast = (over?: Partial<CastMember>) => setCast((c) => [...c, { id: uid(), name: over?.name || "", character: over?.character || "", callTime: over?.callTime || "", wardrobe: over?.wardrobe || "" }]);
  const updateCast = (id: string, patch: Partial<CastMember>) => setCast((c) => c.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeCast = (id: string) => setCast((c) => c.filter((m) => m.id !== id));

  const addScene = (over?: Partial<Scene>) => setScenes((s) => [...s, { id: uid(), sceneNumber: over?.sceneNumber || "", pages: over?.pages || "", location: over?.location || "", notes: over?.notes || "" }]);
  const updateScene = (id: string, patch: Partial<Scene>) => setScenes((s) => s.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)));
  const removeScene = (id: string) => setScenes((s) => s.filter((sc) => sc.id !== id));

  // Presets
  const savePreset = (name: string) => {
    const payload: Callsheet = { title: name || title, production, date, callTime, location, address, weather, notes, crew, cast, scenes };
    const next = [payload, ...presets.filter((p) => p.title !== payload.title)].slice(0, 20);
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const loadPreset = (idx: number) => {
    const p = presets[idx];
    if (!p) return;
    setTitle(p.title);
    setProduction(p.production);
    setDate(p.date);
    setCallTime(p.callTime);
    setLocation(p.location);
    setAddress(p.address || "");
    setWeather(p.weather || "");
    setNotes(p.notes || "");
    setCrew(p.crew || []);
    setCast(p.cast || []);
    setScenes(p.scenes || []);
  };

  const deletePreset = (idx: number) => {
    const next = [...presets.slice(0, idx), ...presets.slice(idx + 1)];
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // Export: Printable HTML -> open new window and print
  const exportPDF = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    const doc = printWindow.document;
    const html = buildPrintableHTML();
    doc.open();
    doc.write(html);
    doc.close();
    // give browser a moment to render
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const buildPrintableHTML = () => {
    const safe = (s?: string) => (s ? s.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "");
    const crewRows = crew.map((c) => `<tr><td>${safe(c.name)}</td><td>${safe(c.role)}</td><td>${safe(c.callTime)}</td><td>${safe(c.contact)}</td></tr>`).join("");
    const castRows = cast.map((c) => `<tr><td>${safe(c.name)}</td><td>${safe(c.character)}</td><td>${safe(c.callTime)}</td><td>${safe(c.wardrobe)}</td></tr>`).join("");
    const sceneRows = scenes.map((s) => `<tr><td>${safe(s.sceneNumber)}</td><td>${safe(s.pages)}</td><td>${safe(s.location)}</td><td>${safe(s.notes)}</td></tr>`).join("");

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Callsheet - ${safe(title)}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 20px; }
          h1,h2,h3 { margin: 0 0 8px 0 }
          .meta { margin-bottom: 12px }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px }
          td,th { border: 1px solid #ddd; padding: 6px; text-align: left }
          .small { font-size: 12px; color: #555 }
        </style>
      </head>
      <body>
        <h1>${safe(title)}</h1>
        <div class="meta small">Production: ${safe(production)} | Date: ${safe(date)} | Call: ${safe(callTime)} | Location: ${safe(location)}</div>

        <h3>Crew</h3>
        <table><thead><tr><th>Name</th><th>Role</th><th>Call</th><th>Contact</th></tr></thead><tbody>${crewRows}</tbody></table>

        <h3>Cast</h3>
        <table><thead><tr><th>Name</th><th>Character</th><th>Call</th><th>Wardrobe</th></tr></thead><tbody>${castRows}</tbody></table>

        <h3>Scenes & Locations</h3>
        <table><thead><tr><th>Scene</th><th>Pages</th><th>Location</th><th>Notes</th></tr></thead><tbody>${sceneRows}</tbody></table>

        <h3>Notes</h3>
        <div class="small">${safe(notes)}</div>
      </body>
      </html>
    `;
  };

  const exportJSON = () => {
    const data: Callsheet = { title, production, date, callTime, location, address, weather, notes, crew, cast, scenes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `callsheet-${date}.json`;
    a.click();
  };

  return (
    <ToolShell toolId="callsheet-builder" toolName="Callsheet Builder" getCurrentState={getCurrentState} onLoad={onLoad}>
      <div className="space-y-6">
        <Card className="p-6">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label>Production</Label>
              <Input value={production} onChange={(e) => setProduction(e.target.value)} className="mt-2" />
            </div>

            <div className="col-span-6 md:col-span-3">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2" />
            </div>
            <div className="col-span-6 md:col-span-3">
              <Label>Call Time</Label>
              <Input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} className="mt-2" />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" className="mt-2" />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Label>Weather (optional)</Label>
              <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Sunny / 22°C / Wind SSE 10 km/h" className="mt-2" />
              <Label className="mt-2">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-2" />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => addCrew()}><Plus className="mr-2 h-4 w-4" />Add Crew</Button>
            <Button onClick={() => addCast()}><Plus className="mr-2 h-4 w-4" />Add Cast</Button>
            <Button onClick={() => addScene()}><Plus className="mr-2 h-4 w-4" />Add Scene</Button>

            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={exportJSON}><Download className="mr-2 h-4 w-4" />Export JSON</Button>
              <Button variant="outline" onClick={exportPDF}><Printer className="mr-2 h-4 w-4" />Export PDF</Button>
              <Button onClick={() => savePreset(title)}><Save className="mr-2 h-4 w-4" />Save Preset</Button>
            </div>
          </div>
        </Card>

        {/* Lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Crew</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {crew.length === 0 && <div className="text-sm text-gray-400">No crew added</div>}
              {crew.map((c) => (
                <div key={c.id} className="flex gap-2 items-center">
                  <Input placeholder="Name" value={c.name} onChange={(e) => updateCrew(c.id, { name: e.target.value })} />
                  <Input placeholder="Role" value={c.role} onChange={(e) => updateCrew(c.id, { role: e.target.value })} />
                  <Input placeholder="Call" value={c.callTime} onChange={(e) => updateCrew(c.id, { callTime: e.target.value })} />
                  <Button variant="ghost" onClick={() => removeCrew(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Cast</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {cast.length === 0 && <div className="text-sm text-gray-400">No cast added</div>}
              {cast.map((c) => (
                <div key={c.id} className="flex gap-2 items-center">
                  <Input placeholder="Name" value={c.name} onChange={(e) => updateCast(c.id, { name: e.target.value })} />
                  <Input placeholder="Character" value={c.character} onChange={(e) => updateCast(c.id, { character: e.target.value })} />
                  <Input placeholder="Call" value={c.callTime} onChange={(e) => updateCast(c.id, { callTime: e.target.value })} />
                  <Button variant="ghost" onClick={() => removeCast(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-2">Scenes</h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {scenes.length === 0 && <div className="text-sm text-gray-400">No scenes added</div>}
              {scenes.map((s) => (
                <div key={s.id} className="flex gap-2 items-center">
                  <Input placeholder="Scene #" value={s.sceneNumber} onChange={(e) => updateScene(s.id, { sceneNumber: e.target.value })} />
                  <Input placeholder="Pages" value={s.pages} onChange={(e) => updateScene(s.id, { pages: e.target.value })} />
                  <Input placeholder="Loc" value={s.location} onChange={(e) => updateScene(s.id, { location: e.target.value })} />
                  <Button variant="ghost" onClick={() => removeScene(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Presets list */}
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Presets</h3>
          <div className="space-y-2">
            {presets.length === 0 && <div className="text-sm text-gray-400">No saved presets</div>}
            {presets.map((p, i) => (
              <div key={p.title} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-400">{p.date} • {p.callTime} • {p.location}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => loadPreset(i)}>Load</Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePreset(i)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Printable preview (hidden) - developer can use SAMPLE_BG path to display background image if desired */}
        <div style={{ display: "none" }}>
          <div ref={printableRef} dangerouslySetInnerHTML={{ __html: buildPrintableHTML() }} />
        </div>

      </div>
    </ToolShell>
  );
}
