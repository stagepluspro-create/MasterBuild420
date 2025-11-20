"use client";

import React, { useRef, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Download, Printer, Save } from "lucide-react";

type CrewMember = { id: string; name: string; role: string; contact?: string; callTime?: string };
type CastMember = { id: string; name: string; character?: string; callTime?: string; wardrobe?: string };
type Scene = { id: string; sceneNumber: string; pages?: string; location?: string; notes?: string };

type Callsheet = {
  title: string;
  production: string;
  date: string;
  callTime: string;
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
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const printableRef = useRef<HTMLDivElement | null>(null);

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

  const addCrew = () => {
    setCrew((c) => [...c, { id: uid(), name: "", role: "", contact: "", callTime: "" }]);
  };
  const updateCrew = (id: string, patch: Partial<CrewMember>) => setCrew((c) => c.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeCrew = (id: string) => setCrew((c) => c.filter((m) => m.id !== id));

  const addCast = () => setCast((c) => [...c, { id: uid(), name: "", character: "", callTime: "", wardrobe: "" }]);
  const updateCast = (id: string, patch: Partial<CastMember>) => setCast((c) => c.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeCast = (id: string) => setCast((c) => c.filter((m) => m.id !== id));

  const addScene = () => setScenes((s) => [...s, { id: uid(), sceneNumber: "", pages: "", location: "", notes: "" }]);
  const updateScene = (id: string, patch: Partial<Scene>) => setScenes((s) => s.map((sc) => (sc.id === id ? { ...sc, ...patch } : sc)));
  const removeScene = (id: string) => setScenes((s) => s.filter((sc) => sc.id !== id));

  const savePreset = (name: string) => {
    const payload: Callsheet = { title: name || title, production, date, callTime, location, address, weather, notes, crew, cast, scenes };
    const next = [payload, ...presets.filter((p) => p.title !== payload.title)].slice(0, 20);
    setPresets(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const exportPDF = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    const doc = printWindow.document;
    const html = buildPrintableHTML();
    doc.open();
    doc.write(html);
    doc.close();
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
          body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 20px; background: white; }
          h1,h2,h3 { margin: 0 0 8px 0 }
          .meta { margin-bottom: 12px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; page-break-inside: avoid; }
          td,th { border: 1px solid #333; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f0f0f0; font-weight: bold; }
          .small { font-size: 12px; color: #555; margin-top: 16px; }
          @media print {
            body { margin: 10mm; }
            h1 { font-size: 18pt; }
            h3 { font-size: 14pt; margin-top: 12px; }
          }
        </style>
      </head>
      <body>
        <h1>${safe(title)}</h1>
        <div class="meta">
          <strong>Production:</strong> ${safe(production)} |
          <strong>Date:</strong> ${safe(date)} |
          <strong>Call Time:</strong> ${safe(callTime)} |
          <strong>Location:</strong> ${safe(location)}
          ${address ? `<br/><strong>Address:</strong> ${safe(address)}` : ''}
          ${weather ? `<br/><strong>Weather:</strong> ${safe(weather)}` : ''}
        </div>

        <h3>Crew</h3>
        <table><thead><tr><th>Name</th><th>Role</th><th>Call Time</th><th>Contact</th></tr></thead><tbody>${crewRows || '<tr><td colspan="4">No crew members</td></tr>'}</tbody></table>

        <h3>Cast</h3>
        <table><thead><tr><th>Name</th><th>Character</th><th>Call Time</th><th>Wardrobe</th></tr></thead><tbody>${castRows || '<tr><td colspan="4">No cast members</td></tr>'}</tbody></table>

        <h3>Scenes & Schedule</h3>
        <table><thead><tr><th>Scene #</th><th>Pages</th><th>Location</th><th>Notes</th></tr></thead><tbody>${sceneRows || '<tr><td colspan="4">No scenes</td></tr>'}</tbody></table>

        ${notes ? `<h3>Production Notes</h3><div class="small">${safe(notes)}</div>` : ''}
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
    URL.revokeObjectURL(url);
  };

  return (
    <ToolShell toolId="callsheet-builder" toolName="Callsheet Builder" getCurrentState={getCurrentState} onLoad={onLoad}>
      <div className="space-y-6">
        <Card className="p-6 glass-panel">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <Label className="text-gray-200">Callsheet Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 bg-white/5" placeholder="Day 1 Callsheet" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <Label className="text-gray-200">Production Name</Label>
              <Input value={production} onChange={(e) => setProduction(e.target.value)} className="mt-2 bg-white/5" placeholder="My Film Project" />
            </div>

            <div className="col-span-6 md:col-span-3">
              <Label className="text-gray-200">Shoot Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 bg-white/5" />
            </div>
            <div className="col-span-6 md:col-span-3">
              <Label className="text-gray-200">General Call Time</Label>
              <Input type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} className="mt-2 bg-white/5" />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Label className="text-gray-200">Primary Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 bg-white/5" placeholder="Studio A / Warehouse District" />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address (optional)" className="mt-2 bg-white/5" />
            </div>

            <div className="col-span-12 md:col-span-6">
              <Label className="text-gray-200">Weather Forecast</Label>
              <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Sunny, 22°C, Wind SSE 10 km/h" className="mt-2 bg-white/5" />
              <Label className="text-gray-200 mt-2 block">Production Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-2 bg-white/5" placeholder="Important reminders, parking info, safety notes..." />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
            <Button onClick={addCrew} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Crew</Button>
            <Button onClick={addCast} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Cast</Button>
            <Button onClick={addScene} variant="outline"><Plus className="mr-2 h-4 w-4" />Add Scene</Button>

            <div className="ml-auto flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportJSON}><Download className="mr-2 h-4 w-4" />JSON</Button>
              <Button variant="outline" onClick={exportPDF}><Printer className="mr-2 h-4 w-4" />Print PDF</Button>
              <Button onClick={() => savePreset(title)} className="bg-gradient-to-r from-cyan-500 to-violet-500"><Save className="mr-2 h-4 w-4" />Save Preset</Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-4 glass-panel">
            <h3 className="font-semibold mb-4 text-lg gradient-text">Crew ({crew.length})</h3>
            <div className="space-y-3 max-h-96 overflow-auto pr-2">
              {crew.length === 0 && <div className="text-sm text-gray-400 text-center py-8">No crew members added yet</div>}
              {crew.map((c) => (
                <div key={c.id} className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Name" value={c.name} onChange={(e) => updateCrew(c.id, { name: e.target.value })} className="bg-white/5 flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => removeCrew(c.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                  <Input placeholder="Role / Department" value={c.role} onChange={(e) => updateCrew(c.id, { role: e.target.value })} className="bg-white/5" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Call time" value={c.callTime} onChange={(e) => updateCrew(c.id, { callTime: e.target.value })} className="bg-white/5 text-sm" />
                    <Input placeholder="Contact" value={c.contact} onChange={(e) => updateCrew(c.id, { contact: e.target.value })} className="bg-white/5 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 glass-panel">
            <h3 className="font-semibold mb-4 text-lg gradient-text">Cast ({cast.length})</h3>
            <div className="space-y-3 max-h-96 overflow-auto pr-2">
              {cast.length === 0 && <div className="text-sm text-gray-400 text-center py-8">No cast members added yet</div>}
              {cast.map((c) => (
                <div key={c.id} className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Actor name" value={c.name} onChange={(e) => updateCast(c.id, { name: e.target.value })} className="bg-white/5 flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => removeCast(c.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                  <Input placeholder="Character name" value={c.character} onChange={(e) => updateCast(c.id, { character: e.target.value })} className="bg-white/5" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Call time" value={c.callTime} onChange={(e) => updateCast(c.id, { callTime: e.target.value })} className="bg-white/5 text-sm" />
                    <Input placeholder="Wardrobe" value={c.wardrobe} onChange={(e) => updateCast(c.id, { wardrobe: e.target.value })} className="bg-white/5 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 glass-panel">
            <h3 className="font-semibold mb-4 text-lg gradient-text">Scenes ({scenes.length})</h3>
            <div className="space-y-3 max-h-96 overflow-auto pr-2">
              {scenes.length === 0 && <div className="text-sm text-gray-400 text-center py-8">No scenes added yet</div>}
              {scenes.map((s) => (
                <div key={s.id} className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Scene #" value={s.sceneNumber} onChange={(e) => updateScene(s.id, { sceneNumber: e.target.value })} className="bg-white/5 w-24" />
                    <Input placeholder="Pages" value={s.pages} onChange={(e) => updateScene(s.id, { pages: e.target.value })} className="bg-white/5 w-20" />
                    <Button variant="ghost" size="sm" onClick={() => removeScene(s.id)}><Trash2 className="h-4 w-4 text-red-400" /></Button>
                  </div>
                  <Input placeholder="Location" value={s.location} onChange={(e) => updateScene(s.id, { location: e.target.value })} className="bg-white/5" />
                  <Input placeholder="Notes" value={s.notes} onChange={(e) => updateScene(s.id, { notes: e.target.value })} className="bg-white/5 text-sm" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {presets.length > 0 && (
          <Card className="p-4 glass-panel">
            <h3 className="font-semibold mb-4 gradient-text">Saved Presets</h3>
            <div className="space-y-2">
              {presets.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <div className="font-medium text-white">{p.title}</div>
                    <div className="text-xs text-gray-400">{p.date} • {p.callTime} • {p.location} • {p.crew.length + p.cast.length} people</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => loadPreset(i)}>Load</Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePreset(i)} className="text-red-400">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div style={{ display: "none" }}>
          <div ref={printableRef} dangerouslySetInnerHTML={{ __html: buildPrintableHTML() }} />
        </div>
      </div>
    </ToolShell>
  );
}
