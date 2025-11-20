"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  SkipForward,
  RefreshCw,
} from "lucide-react";

/**
 * Teleprompter 2.0
 *
 * Features:
 * - Smooth time-delta based scroll (frame-rate independent)
 * - Adjustable speed (WPM-like percentage), font size, line spacing, margins
 * - Mirror & invert for camera rigs
 * - Progress bar + current position
 * - Auto-pause at MARKERS (lines starting with "###" or `[[PAUSE]]`)
 * - Import/Export script (.txt)
 * - Save / load presets (localStorage)
 * - Fullscreen handling and keyboard shortcuts
 *
 * Note: the uploaded screenshot (for background preview) is referenced below:
 * SAMPLE_BG = "/mnt/data/Screenshot 2025-11-20 204756.png"
 * Your toolchain should transform that local path to a proper URL when building.
 */

// --- constants
const SAMPLE_BG = "/mnt/data/Screenshot 2025-11-20 204756.png";
const DEFAULT_SCRIPT = `Enter your script here...

Use "###" at the start of a line to add an auto-pause marker.
Example:
This is the first paragraph.
### PAUSE
This will pause when the marker scrolls into view.

Tip: Use larger font sizes for on-camera reading.
`;

const STORAGE_KEY = "teleprompter-v2-presets";

type Preset = {
  name: string;
  text: string;
  speed: number;
  fontSize: number;
  lineHeight: number;
  margin: number;
  mirror: boolean;
  invert: boolean;
};

// --- helpers
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const readTextFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = reject;
    r.readAsText(file);
  });

export default function Teleprompter2() {
  // script & UI
  const [text, setText] = useState<string>(DEFAULT_SCRIPT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(50); // percent -- higher = faster
  const [fontSize, setFontSize] = useState<number>(36);
  const [lineHeight, setLineHeight] = useState<number>(1.6);
  const [margin, setMargin] = useState<number>(20); // px padding inside display
  const [mirror, setMirror] = useState<boolean>(false);
  const [invert, setInvert] = useState<boolean>(false);

  // internal scroll & timing
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [progress, setProgress] = useState<number>(0); // 0-1

  // presets
  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [presetName, setPresetName] = useState("");

  // auto-pause markers (lines beginning with "###" or containing [[PAUSE]])
  const parseMarkers = useCallback((script: string) => {
    const lines = script.split("\n");
    const markers: { index: number; text: string }[] = [];
    let cumulativeChars = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith("###") || line.includes("[[PAUSE]]")) {
        markers.push({ index: i, text: line.trim() });
      }
      cumulativeChars += line.length + 1;
    }
    return markers;
  }, []);

  // compute target scroll speed in px/sec based on "speed" and font size
  // base speed chosen so 50% moves roughly one line per ~0.25s at medium font;
  // tuned to feel smooth and adjustable.
  const computePxPerSec = (speedPercent: number, fontPx: number, lineH: number) => {
    // baseline = fontPx * lineH is one line height
    const linePx = fontPx * lineH;
    // speedPercent 50 -> multiplier 1.0 ; allow 10..200 mapping
    const multiplier = speedPercent / 50;
    const baseLinesPerSec = 0.8; // tuned constant
    return linePx * baseLinesPerSec * multiplier;
  };

  // play/pause loop (time-delta)
  useEffect(() => {
    const step = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000; // seconds
      lastTsRef.current = ts;

      if (isPlaying && scrollRef.current && contentRef.current) {
        const pxPerSec = computePxPerSec(speed, fontSize, lineHeight);
        const delta = pxPerSec * dt;
        const el = scrollRef.current;
        const maxScroll = contentRef.current.clientHeight - el.clientHeight;
        const next = clamp(el.scrollTop + delta, 0, Math.max(0, maxScroll));
        el.scrollTop = next;
        setProgress(maxScroll <= 0 ? 1 : next / maxScroll);

        // auto-pause detection: if a marker element exists inside and is near center, pause
        // We'll check markers by scanning for elements with data-marker attribute
        const markers = contentRef.current.querySelectorAll<HTMLElement>("[data-marker]");
        for (const m of markers) {
          const rect = m.getBoundingClientRect();
          const containerRect = el.getBoundingClientRect();
          const centerY = containerRect.top + containerRect.height / 2;
          // pause when marker's center is within +/- 30px of container center
          const markerCenter = rect.top + rect.height / 2;
          if (Math.abs(markerCenter - centerY) < 30) {
            // pause and remove marker's attribute so we don't repeatedly pause
            if (isPlaying) {
              setIsPlaying(false);
              // mark as handled
              m.removeAttribute("data-marker");
            }
            break;
          }
        }

        if (next >= maxScroll) {
          setIsPlaying(false);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    };

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(step);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTsRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTsRef.current = null;
    };
  }, [isPlaying, speed, fontSize, lineHeight]);

  // when script or font changes, re-render markers and reset handled markers
  useEffect(() => {
    if (!contentRef.current) return;
    // annotate marker lines inside content DOM for auto-pause detection
    const markerLines = contentRef.current.querySelectorAll("[data-line-number]");
    markerLines.forEach((el) => {
      (el as HTMLElement).removeAttribute("data-marker");
    });

    const lines = text.split("\n");
    // find each child line element by index and add data-marker if needed
    lines.forEach((line, idx) => {
      const el = contentRef.current?.querySelector(`[data-line-number="${idx}"]`) as HTMLElement | null;
      if (el && (line.trim().startsWith("###") || line.includes("[[PAUSE]]"))) {
        el.setAttribute("data-marker", "true");
      }
    });
  }, [text, fontSize, lineHeight]);

  // sync scrollPosition to state when user drags scroll (progress update)
  useEffect(() => {
    const el = scrollRef.current;
    const handle = () => {
      if (!el || !contentRef.current) return;
      const maxScroll = contentRef.current.clientHeight - el.clientHeight;
      setProgress(maxScroll <= 0 ? 1 : el.scrollTop / maxScroll);
    };
    el?.addEventListener("scroll", handle);
    return () => el?.removeEventListener("scroll", handle);
  }, []);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Space toggles play/pause unless focused on an input/textarea
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || (document.activeElement as HTMLElement)?.isContentEditable;
      if (e.code === "Space" && !isTyping) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowUp") {
        setSpeed((s) => clamp(s + 5, 10, 200));
      } else if (e.key === "ArrowDown") {
        setSpeed((s) => clamp(s - 5, 10, 200));
      } else if (e.code === "KeyM") {
        setMirror((m) => !m);
      } else if (e.code === "KeyI") {
        setInvert((i) => !i);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // reset
  const reset = () => {
    setIsPlaying(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setProgress(0);
    // re-annotate markers for future pauses
    if (contentRef.current) {
      const markers = contentRef.current.querySelectorAll("[data-marker]");
      markers.forEach((m) => m.setAttribute("data-marker", "true"));
    }
  };

  // fullscreen toggle (works on scrollRef container)
  const toggleFullscreen = async () => {
    try {
      const el = scrollRef.current;
      if (!el) return;
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch (e) {
      // ignore
    }
  };

  // import / export
  const exportScript = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${Date.now()}.txt`;
    a.click();
  };

  const importScript = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    setText(content);
    // reset marker annotation so new markers register
    setTimeout(() => reset(), 50);
  };

  // presets: save / load / delete
  const savePreset = (name: string) => {
    if (!name) return;
    const p: Preset = {
      name,
      text,
      speed,
      fontSize,
      lineHeight,
      margin,
      mirror,
      invert,
    };
    const next = [...presets.filter((x) => x.name !== name), p];
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPresetName("");
  };

  const loadPreset = (p: Preset) => {
    setText(p.text);
    setSpeed(p.speed);
    setFontSize(p.fontSize);
    setLineHeight(p.lineHeight);
    setMargin(p.margin);
    setMirror(p.mirror);
    setInvert(p.invert);
    // after loading, reset scroll & markers
    setTimeout(() => reset(), 50);
  };

  const deletePreset = (name: string) => {
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  // helper: render script lines as individual divs (so we can target markers precisely)
  const renderLines = () => {
    return text.split("\n").map((line, i) => {
      // preserve empty lines with &nbsp; to maintain spacing
      const safe = line === "" ? "\u00A0" : line;
      const isMarker = line.trim().startsWith("###") || line.includes("[[PAUSE]]");
      return (
        <div
          key={i}
          data-line-number={i}
          data-marker={isMarker ? "true" : undefined}
          style={{
            padding: `${Math.max(4, margin / 6)}px 0`,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}
        >
          <span style={{ opacity: isMarker ? 0.85 : 1 }}>{safe}</span>
        </div>
      );
    });
  };

  // ToolShell persistence
  const getCurrentState = () => ({
    text,
    speed,
    fontSize,
    lineHeight,
    margin,
    mirror,
    invert,
  });
  const handleLoadPreset = (data: any) => {
    if (!data) return;
    if (data.text !== undefined) setText(data.text);
    if (data.speed !== undefined) setSpeed(data.speed);
    if (data.fontSize !== undefined) setFontSize(data.fontSize);
    if (data.lineHeight !== undefined) setLineHeight(data.lineHeight);
    if (data.margin !== undefined) setMargin(data.margin);
    if (data.mirror !== undefined) setMirror(Boolean(data.mirror));
    if (data.invert !== undefined) setInvert(Boolean(data.invert));
    setTimeout(() => reset(), 50);
  };

  return (
    <ToolShell
      toolId="teleprompter-2"
      toolName="Teleprompter"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        {/* Editor */}
        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Script</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Write or paste your script here..."
                className="mt-2 font-sans"
              />
              <div className="flex gap-2 mt-3">
                <Button variant="outline" onClick={() => exportScript()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export .txt
                </Button>

                <label htmlFor="import-script" className="cursor-pointer">
                  <input
                    id="import-script"
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importScript(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import .txt
                  </Button>
                </label>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setText(DEFAULT_SCRIPT);
                    setTimeout(() => reset(), 50);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Script
                </Button>
              </div>
            </div>

            <div>
              <Label>Presets</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                />
                <Button onClick={() => savePreset(presetName || `Preset ${Date.now()}`)}>
                  Save
                </Button>
              </div>

              <div className="mt-3 space-y-2 max-h-44 overflow-auto">
                {presets.length === 0 && <div className="text-sm text-gray-400">No presets saved</div>}
                {presets.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="font-medium text-white text-sm">{p.name}</div>
                      <div className="text-xs text-gray-400">
                        {p.fontSize}px • {p.speed}%
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => loadPreset(p)}>
                        Load
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deletePreset(p.name)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>Speed: {Math.round(speed)}%</Label>
                <div className="text-sm text-gray-400">Use Arrow keys: ▲ / ▼</div>
              </div>
              <Slider value={[speed]} onValueChange={(v) => setSpeed(v[0])} min={10} max={200} step={1} />

              <div className="flex items-center justify-between mt-2">
                <Label>Font Size: {fontSize}px</Label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setFontSize((s) => clamp(s - 2, 16, 120))}>
                    <ChevronDown />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setFontSize((s) => clamp(s + 2, 16, 120))}>
                    <ChevronUp />
                  </Button>
                </div>
              </div>
              <Slider value={[fontSize]} onValueChange={(v) => setFontSize(v[0])} min={16} max={120} step={1} />

              <div className="flex items-center justify-between mt-2">
                <Label>Line Height: {lineHeight.toFixed(2)}</Label>
                <div className="text-sm text-gray-400">Spacing between lines</div>
              </div>
              <Slider value={[lineHeight]} onValueChange={(v) => setLineHeight(v[0])} min={1} max={2.5} step={0.01} />

              <div className="flex items-center justify-between mt-2">
                <Label>Margin (px): {margin}px</Label>
                <div className="text-sm text-gray-400">Edge padding inside teleprompter</div>
              </div>
              <Slider value={[margin]} onValueChange={(v) => setMargin(v[0])} min={0} max={120} step={1} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mirror</Label>
                  <div className="text-xs text-gray-400">Flip horizontally for mirrored rigs</div>
                </div>
                <Switch checked={mirror} onCheckedChange={setMirror} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Invert Colors</Label>
                  <div className="text-xs text-gray-400">Dark background / light text</div>
                </div>
                <Switch checked={invert} onCheckedChange={setInvert} />
              </div>

              <div className="flex gap-2 mt-3">
                <Button onClick={() => setIsPlaying((p) => !p)} className="flex-1">
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" /> Start
                    </>
                  )}
                </Button>

                <Button onClick={reset} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>

                <Button onClick={toggleFullscreen} variant="outline">
                  <Maximize className="mr-2 h-4 w-4" /> Fullscreen
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button onClick={() => {
                  // skip forward 20% of remaining length
                  const el = scrollRef.current;
                  if (!el || !contentRef.current) return;
                  const max = contentRef.current.clientHeight - el.clientHeight;
                  const next = clamp(el.scrollTop + max * 0.2, 0, max);
                  el.scrollTop = next;
                }}>
                  <SkipForward className="mr-2 h-4 w-4" /> Skip
                </Button>

                <Button onClick={() => {
                  // quick step back to top
                  if (scrollRef.current) scrollRef.current.scrollTop = 0;
                }} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" /> Top
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
          <div className="h-full bg-cyan-400" style={{ width: `${progress * 100}%` }} />
        </div>

        {/* Teleprompter Display */}
        <Card className={`relative overflow-hidden ${invert ? "bg-white" : "bg-black"}`}>
          {/* background preview (sample image) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img src={SAMPLE_BG} alt="bg" className="w-full h-full object-cover" />
          </div>

          <div
            ref={scrollRef}
            className="relative z-10 mx-auto"
            style={{
              height: "50vh",
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: mirror ? "scaleX(-1)" : undefined,
              padding: `${margin}px`,
            }}
          >
            <div
              ref={contentRef}
              style={{
                width: "100%",
                maxWidth: "1200px",
                color: invert ? "#000000" : "#ffffff",
                fontSize: `${fontSize}px`,
                lineHeight,
                textAlign: "center",
                fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
                whiteSpace: "pre-wrap",
              }}
            >
              {renderLines()}
            </div>
          </div>

          {/* small footer controls overlay */}
          <div className="absolute left-4 bottom-4 flex items-center gap-2 z-20">
            <div className="text-xs text-gray-300/80">
              {Math.round(progress * 100)}%
            </div>
          </div>
        </Card>
      </div>
    </ToolShell>
  );
}
