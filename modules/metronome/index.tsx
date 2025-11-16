"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Music2,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { MetronomeEngine, ClickSoundType, SubdivisionType } from "./metronome-engine";

const TIME_SIGNATURES = [
  { label: "2/4", beats: 2 },
  { label: "3/4", beats: 3 },
  { label: "4/4", beats: 4 },
  { label: "5/4", beats: 5 },
  { label: "6/8", beats: 6 },
  { label: "7/8", beats: 7 },
  { label: "9/8", beats: 9 },
  { label: "12/8", beats: 12 },
];

const SOUND_TYPES: { value: ClickSoundType; label: string; icon: string }[] = [
  { value: "woodblock", label: "Woodblock", icon: "🪵" },
  { value: "beep", label: "Beep", icon: "📢" },
  { value: "digital", label: "Digital", icon: "⚡" },
  { value: "rimshot", label: "Rimshot", icon: "🥁" },
];

const SUBDIVISIONS: { value: SubdivisionType; label: string }[] = [
  { value: "quarter", label: "Quarter" },
  { value: "eighth", label: "Eighth" },
  { value: "triplet", label: "Triplet" },
  { value: "sixteenth", label: "Sixteenth" },
];

const AUTO_STOP_OPTIONS = [
  { label: "15 seconds", value: 15 },
  { label: "30 seconds", value: 30 },
  { label: "60 seconds", value: 60 },
  { label: "Continuous", value: 0 },
];

export default function Metronome() {
  const engineRef = useRef<MetronomeEngine>(new MetronomeEngine());
  const autoStopTimerRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(false);

  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState(4);
  const [soundType, setSoundType] = useState<ClickSoundType>("woodblock");
  const [subdivision, setSubdivision] = useState<SubdivisionType>("quarter");
  const [accentVolume, setAccentVolume] = useState(80);
  const [beatVolume, setBeatVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [autoStopDuration, setAutoStopDuration] = useState(30);

  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubdivision, setCurrentSubdivision] = useState(0);
  const [visualPulse, setVisualPulse] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isPlaying) {
        e.preventDefault();
        startMetronome();
      } else if (e.code === "Space" && isPlaying) {
        e.preventDefault();
        stopMetronome();
      } else if (e.code === "KeyT") {
        e.preventDefault();
        handleTapTempo();
      } else if (e.code === "Escape" && isPlaying) {
        stopMetronome();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, bpm]);

  useEffect(() => {
    engineRef.current.setOnBeatCallback((beat, sub) => {
      setCurrentBeat(beat);
      setCurrentSubdivision(sub);
      setVisualPulse(true);
      setTimeout(() => setVisualPulse(false), 100);

      if (hapticEnabled && navigator.vibrate && sub === 0) {
        navigator.vibrate(beat === 0 ? 50 : 20);
      }
    });

    return () => {
      engineRef.current.cleanup();
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, [hapticEnabled]);

  const startMetronome = () => {
    engineRef.current.updateConfig({
      bpm,
      beatsPerMeasure: timeSignature,
      subdivision,
      soundType,
      accentVolume: accentVolume / 100,
      beatVolume: beatVolume / 100,
      muted,
    });

    engineRef.current.start();
    setIsPlaying(true);

    if (autoStopDuration > 0) {
      autoStopTimerRef.current = window.setTimeout(() => {
        stopMetronome();
      }, autoStopDuration * 1000);
    }
  };

  const stopMetronome = () => {
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentBeat(0);
    setCurrentSubdivision(0);

    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clampedBpm = Math.max(20, Math.min(300, newBpm));
    setBpm(clampedBpm);
    if (isPlaying) {
      engineRef.current.updateConfig({ bpm: clampedBpm });
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);

    tapTimesRef.current = tapTimesRef.current.filter((t) => now - t < 3000);

    if (tapTimesRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      handleBpmChange(calculatedBpm);
    }
  };

  const toggleMute = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    if (isPlaying) {
      engineRef.current.updateConfig({ muted: newMuted });
    }
  };

  const getCurrentState = () => ({
    bpm,
    timeSignature,
    soundType,
    subdivision,
    accentVolume,
    beatVolume,
    muted,
    autoStopDuration,
    hapticEnabled,
  });

  const handleLoadPreset = (data: any) => {
    if (isPlaying) stopMetronome();

    if (data.bpm !== undefined) setBpm(data.bpm);
    if (data.timeSignature !== undefined) setTimeSignature(data.timeSignature);
    if (data.soundType !== undefined) setSoundType(data.soundType);
    if (data.subdivision !== undefined) setSubdivision(data.subdivision);
    if (data.accentVolume !== undefined) setAccentVolume(data.accentVolume);
    if (data.beatVolume !== undefined) setBeatVolume(data.beatVolume);
    if (data.muted !== undefined) setMuted(data.muted);
    if (data.autoStopDuration !== undefined) setAutoStopDuration(data.autoStopDuration);
    if (data.hapticEnabled !== undefined) setHapticEnabled(data.hapticEnabled);
  };

  const getSubdivisionMultiplier = () => {
    switch (subdivision) {
      case "quarter":
        return 1;
      case "eighth":
        return 2;
      case "triplet":
        return 3;
      case "sixteenth":
        return 4;
      default:
        return 1;
    }
  };

  const renderBeatIndicators = () => {
    const indicators = [];
    const totalSubdivisions = timeSignature * getSubdivisionMultiplier();

    for (let i = 0; i < totalSubdivisions; i++) {
      const beat = Math.floor(i / getSubdivisionMultiplier());
      const sub = i % getSubdivisionMultiplier();
      const isActive = isPlaying && currentBeat === beat && currentSubdivision === sub;
      const isAccent = sub === 0 && beat === 0;

      indicators.push(
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-100 ${
            isActive
              ? isAccent
                ? "bg-gradient-to-r from-cyan-400 to-cyan-500 shadow-lg shadow-cyan-500/50"
                : "bg-gradient-to-r from-violet-400 to-violet-500"
              : "bg-white/10"
          }`}
        />
      );
    }

    return indicators;
  };

  return (
    <ToolShell
      toolId="metronome"
      toolName="Metronome"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        {isMobile && (
          <Card className="border-cyan-500/30 bg-cyan-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-cyan-400">
                <Smartphone className="h-4 w-4" />
                Mobile Device Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-cyan-300/80">
              Enable haptic feedback below for vibration on beats. Audio timing may vary slightly
              on mobile browsers.
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music2 className="h-5 w-5 text-cyan-400" />
                  Tempo Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center flex-1">
                      <div
                        className={`text-7xl font-bold gradient-text mb-2 transition-transform ${
                          visualPulse ? "scale-105" : "scale-100"
                        }`}
                      >
                        {bpm}
                      </div>
                      <div className="text-sm text-gray-400">BPM</div>
                    </div>
                  </div>

                  <Slider
                    value={[bpm]}
                    onValueChange={(v) => handleBpmChange(v[0])}
                    min={20}
                    max={300}
                    step={1}
                    className="mb-4"
                  />

                  <div className="flex gap-2 mb-4">
                    <Input
                      type="number"
                      value={bpm}
                      onChange={(e) => handleBpmChange(parseFloat(e.target.value) || 20)}
                      min={20}
                      max={300}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleTapTempo}
                      className="min-w-[100px]"
                    >
                      Tap (T)
                    </Button>
                  </div>

                  <div className="text-xs text-gray-400 text-center">
                    Tap 3+ times to set tempo
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Time Signature</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SIGNATURES.map((sig) => (
                      <Button
                        key={sig.label}
                        variant={timeSignature === sig.beats ? "default" : "outline"}
                        onClick={() => setTimeSignature(sig.beats)}
                        disabled={isPlaying}
                      >
                        {sig.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Click Sound</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {SOUND_TYPES.map((sound) => (
                      <Button
                        key={sound.value}
                        variant={soundType === sound.value ? "default" : "outline"}
                        className="flex flex-col h-auto py-3"
                        onClick={() => setSoundType(sound.value)}
                        disabled={isPlaying}
                      >
                        <span className="text-2xl mb-1">{sound.icon}</span>
                        <span className="text-xs">{sound.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Subdivision</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {SUBDIVISIONS.map((sub) => (
                      <Button
                        key={sub.value}
                        variant={subdivision === sub.value ? "default" : "outline"}
                        onClick={() => setSubdivision(sub.value)}
                        disabled={isPlaying}
                      >
                        {sub.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-violet-400" />
                  Volume Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Accent Volume: {accentVolume}%</Label>
                    <Button variant="ghost" size="sm" onClick={toggleMute}>
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Slider
                    value={[accentVolume]}
                    onValueChange={(v) => setAccentVolume(v[0])}
                    min={0}
                    max={100}
                    step={1}
                    disabled={muted}
                  />
                  <p className="text-xs text-gray-400 mt-2">Downbeat volume</p>
                </div>

                <div>
                  <Label className="mb-3 block">Beat Volume: {beatVolume}%</Label>
                  <Slider
                    value={[beatVolume]}
                    onValueChange={(v) => setBeatVolume(v[0])}
                    min={0}
                    max={100}
                    step={1}
                    disabled={muted}
                  />
                  <p className="text-xs text-gray-400 mt-2">Other beats volume</p>
                </div>

                {(accentVolume > 80 || beatVolume > 80) && !muted && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                    High volume may damage hearing or equipment
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Visual Indicator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <div
                    className={`w-32 h-32 rounded-full border-4 transition-all duration-100 ${
                      visualPulse && currentBeat === 0 && currentSubdivision === 0
                        ? "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/50 scale-110"
                        : visualPulse
                        ? "border-violet-400 bg-violet-500/20 scale-105"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {isPlaying ? currentBeat + 1 : "-"}
                        </div>
                        <div className="text-xs text-gray-400">Beat</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-8 gap-1">{renderBeatIndicators()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transport</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isPlaying ? (
                  <Button onClick={startMetronome} className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start (Space)
                  </Button>
                ) : (
                  <Button
                    onClick={stopMetronome}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <Square className="mr-2 h-5 w-5" />
                    Stop (Space)
                  </Button>
                )}

                {isPlaying && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Metronome active</span>
                    <Badge variant="outline">{bpm} BPM</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-3 block">Auto Stop</Label>
                  <Select
                    value={autoStopDuration.toString()}
                    onValueChange={(v) => setAutoStopDuration(parseInt(v))}
                    disabled={isPlaying}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTO_STOP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isMobile && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Haptic Feedback</Label>
                    <Switch checked={hapticEnabled} onCheckedChange={setHapticEnabled} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-cyan-400">
              <Music2 className="h-4 w-4" />
              Usage Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-cyan-300/80 space-y-2">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use spacebar to start/stop, T key for tap tempo</li>
              <li>Accent volume controls the first beat of each measure</li>
              <li>Subdivisions split each beat into smaller increments</li>
              <li>Visual indicators show beat position in real-time</li>
              <li>Save presets to quickly recall your favorite settings</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </ToolShell>
  );
}
