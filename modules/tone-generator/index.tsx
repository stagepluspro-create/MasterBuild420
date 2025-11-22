"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Square,
  AlertTriangle,
  Waves,
  Volume2,
  Radio,
  Zap,
  Settings2,
  Smartphone,
} from "lucide-react";
import { AudioEngine, WaveformType, ChannelMode, SweepCurve } from "./audio-engine";
import { WaveformVisualizer } from "./waveform-visualizer";

const WAVEFORM_OPTIONS: { value: WaveformType; label: string; icon: string }[] = [
  { value: "sine", label: "Sine", icon: "～" },
  { value: "square", label: "Square", icon: "⊓" },
  { value: "triangle", label: "Triangle", icon: "△" },
  { value: "sawtooth", label: "Sawtooth", icon: "⌊" },
  { value: "white", label: "White Noise", icon: "◈" },
  { value: "pink", label: "Pink Noise", icon: "◆" },
];

const FREQUENCY_PRESETS = [
  { label: "100 Hz", value: 100 },
  { label: "440 Hz (A4)", value: 440 },
  { label: "1 kHz", value: 1000 },
  { label: "10 kHz", value: 10000 },
];

const AUTO_STOP_OPTIONS = [
  { label: "15 seconds", value: 15 },
  { label: "30 seconds", value: 30 },
  { label: "60 seconds", value: 60 },
  { label: "Continuous", value: 0 },
];

export default function ToneGenerator() {
  const engineRef = useRef<AudioEngine>(new AudioEngine());
  const autoStopTimerRef = useRef<number | null>(null);
  const visualizerUpdateRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [frequency, setFrequency] = useState(1000);
  const [waveform, setWaveform] = useState<WaveformType>("sine");
  const [volume, setVolume] = useState(50);
  const [channel, setChannel] = useState<ChannelMode>("stereo");
  const [maxVolume, setMaxVolume] = useState(80);

  const [extendedMode, setExtendedMode] = useState(false);
  const [autoStopDuration, setAutoStopDuration] = useState(30);

  const [sweepEnabled, setSweepEnabled] = useState(false);
  const [sweepStartFreq, setSweepStartFreq] = useState(20);
  const [sweepEndFreq, setSweepEndFreq] = useState(20000);
  const [sweepDuration, setSweepDuration] = useState(10);
  const [sweepCurve, setSweepCurve] = useState<SweepCurve>("logarithmic");

  const [burstEnabled, setBurstEnabled] = useState(false);
  const [burstOnDuration, setBurstOnDuration] = useState(500);
  const [burstOffDuration, setBurstOffDuration] = useState(500);

  const [analyserData, setAnalyserData] = useState<Uint8Array | null>(null);
  const [currentFrequency, setCurrentFrequency] = useState(0);

  const minFreq = extendedMode ? 1 : 20;
  const maxFreq = extendedMode ? 24000 : 20000;

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
      if (e.key === "Escape" && isPlaying) {
        emergencyStop();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      engineRef.current.cleanup();
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
      if (visualizerUpdateRef.current) {
        cancelAnimationFrame(visualizerUpdateRef.current);
      }
    };
  }, []);

  const updateVisualizer = useCallback(() => {
    if (isPlaying) {
      // const data = engineRef.current.getAnalyserData();
      // const freq = engineRef.current.getCurrentFrequency();
      // setAnalyserData(data);
      // setCurrentFrequency(freq);
      visualizerUpdateRef.current = requestAnimationFrame(updateVisualizer);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      updateVisualizer();
    } else {
      if (visualizerUpdateRef.current) {
        cancelAnimationFrame(visualizerUpdateRef.current);
      }
      setAnalyserData(null);
      setCurrentFrequency(0);
    }
  }, [isPlaying, updateVisualizer]);

  const startToneGeneration = () => {
    setShowSafetyWarning(true);
  };

  const confirmAndStart = () => {
    setShowSafetyWarning(false);

    const config = {
      frequency,
      waveform,
      volume: volume / 100,
      channel,
    };

    const maxVol = maxVolume / 100;

    if (burstEnabled) {
      engineRef.current.startBurst(config, burstOnDuration, burstOffDuration, maxVol);
    } else if (sweepEnabled) {
      engineRef.current.startSweep(
        config,
        {
          startFreq: sweepStartFreq,
          endFreq: sweepEndFreq,
          duration: sweepDuration,
          curve: sweepCurve,
        },
        maxVol
      );
    } else {
      engineRef.current.startTone(config, maxVol);
    }

    setIsPlaying(true);

    if (autoStopDuration > 0) {
      autoStopTimerRef.current = window.setTimeout(() => {
        stopToneGeneration();
      }, autoStopDuration * 1000);
    }
  };

  const stopToneGeneration = () => {
    engineRef.current.stop();
    setIsPlaying(false);

    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  };

  const emergencyStop = () => {
    stopToneGeneration();
  };

  const handleFrequencyChange = (newFreq: number) => {
    const clampedFreq = Math.max(minFreq, Math.min(maxFreq, newFreq));
    setFrequency(clampedFreq);
    if (isPlaying && !sweepEnabled && waveform !== "white" && waveform !== "pink") {
      engineRef.current.setFrequency(clampedFreq);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (isPlaying) {
      engineRef.current.setVolume(newVolume / 100, maxVolume / 100);
    }
  };

  const getCurrentState = () => ({
    frequency,
    waveform,
    volume,
    channel,
    maxVolume,
    extendedMode,
    autoStopDuration,
    sweepEnabled,
    sweepStartFreq,
    sweepEndFreq,
    sweepDuration,
    sweepCurve,
    burstEnabled,
    burstOnDuration,
    burstOffDuration,
  });

  const handleLoadPreset = (data: any) => {
    if (isPlaying) stopToneGeneration();

    if (data.frequency !== undefined) setFrequency(data.frequency);
    if (data.waveform !== undefined) setWaveform(data.waveform);
    if (data.volume !== undefined) setVolume(data.volume);
    if (data.channel !== undefined) setChannel(data.channel);
    if (data.maxVolume !== undefined) setMaxVolume(data.maxVolume);
    if (data.extendedMode !== undefined) setExtendedMode(data.extendedMode);
    if (data.autoStopDuration !== undefined) setAutoStopDuration(data.autoStopDuration);
    if (data.sweepEnabled !== undefined) setSweepEnabled(data.sweepEnabled);
    if (data.sweepStartFreq !== undefined) setSweepStartFreq(data.sweepStartFreq);
    if (data.sweepEndFreq !== undefined) setSweepEndFreq(data.sweepEndFreq);
    if (data.sweepDuration !== undefined) setSweepDuration(data.sweepDuration);
    if (data.sweepCurve !== undefined) setSweepCurve(data.sweepCurve);
    if (data.burstEnabled !== undefined) setBurstEnabled(data.burstEnabled);
    if (data.burstOnDuration !== undefined) setBurstOnDuration(data.burstOnDuration);
    if (data.burstOffDuration !== undefined) setBurstOffDuration(data.burstOffDuration);
  };

  const getFrequencyDisplay = (freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(2)} kHz`;
    }
    return `${freq.toFixed(2)} Hz`;
  };

  const isNoiseMode = waveform === "white" || waveform === "pink";
  const volumeDb = 20 * Math.log10(volume / 100);

  return (
    <ToolShell
      toolId="tone-generator"
      toolName="Tone Generator"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        {isMobile && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
                <Smartphone className="h-4 w-4" />
                Mobile Device Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-amber-300/80">
              Output quality may vary on mobile devices. For professional calibration, use a
              dedicated audio interface with desktop browser.
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5 text-cyan-400" />
                  Waveform Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Waveform Type</Label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {WAVEFORM_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={waveform === option.value ? "default" : "outline"}
                        className="flex flex-col h-auto py-3"
                        onClick={() => setWaveform(option.value)}
                        disabled={isPlaying}
                      >
                        <span className="text-2xl mb-1">{option.icon}</span>
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {!isNoiseMode && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Frequency: {getFrequencyDisplay(frequency)}</Label>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-400">Extended Mode</Label>
                        <Switch checked={extendedMode} onCheckedChange={setExtendedMode} disabled={isPlaying} />
                      </div>
                    </div>

                    <Slider
                      value={[frequency]}
                      onValueChange={(v) => handleFrequencyChange(v[0])}
                      min={minFreq}
                      max={maxFreq}
                      step={1}
                      className="mb-3"
                    />

                    <div className="flex gap-2 mb-3">
                      <Input
                        type="number"
                        value={frequency}
                        onChange={(e) => handleFrequencyChange(parseFloat(e.target.value) || minFreq)}
                        min={minFreq}
                        max={maxFreq}
                        className="flex-1"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {FREQUENCY_PRESETS.map((preset) => (
                        <Button
                          key={preset.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFrequencyChange(preset.value)}
                          disabled={isPlaying}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {extendedMode && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Extended mode includes infrasonic (&lt;20Hz) and ultrasonic (&gt;20kHz) frequencies
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-violet-400" />
                  Output Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Volume: {volume}%</Label>
                    <span className="text-xs text-gray-400 font-mono">
                      {volumeDb > -100 ? volumeDb.toFixed(1) : "-∞"} dBFS
                    </span>
                  </div>
                  <Slider
                    value={[volume]}
                    onValueChange={(v) => handleVolumeChange(v[0])}
                    min={0}
                    max={100}
                    step={1}
                  />
                  {volume > 80 && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      High volume may damage equipment or hearing
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-3 block">Max Volume Limit: {maxVolume}%</Label>
                  <Slider
                    value={[maxVolume]}
                    onValueChange={(v) => setMaxVolume(v[0])}
                    min={10}
                    max={100}
                    step={1}
                    disabled={isPlaying}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Safety limiter prevents volume from exceeding this level
                  </p>
                </div>

                <div>
                  <Label className="mb-3 block">Channel Routing</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={channel === "left" ? "default" : "outline"}
                      onClick={() => setChannel("left")}
                      disabled={isPlaying}
                      className="flex items-center gap-2"
                    >
                      <Radio className="h-4 w-4" />
                      Left
                    </Button>
                    <Button
                      variant={channel === "stereo" ? "default" : "outline"}
                      onClick={() => setChannel("stereo")}
                      disabled={isPlaying}
                      className="flex items-center gap-2"
                    >
                      <Radio className="h-4 w-4" />
                      Stereo
                    </Button>
                    <Button
                      variant={channel === "right" ? "default" : "outline"}
                      onClick={() => setChannel("right")}
                      disabled={isPlaying}
                      className="flex items-center gap-2"
                    >
                      <Radio className="h-4 w-4" />
                      Right
                    </Button>
                  </div>
                </div>

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
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Waveform Display</CardTitle>
              </CardHeader>
              <CardContent>
                <WaveformVisualizer
                  analyserData={analyserData}
                  isActive={isPlaying}
                  currentFrequency={currentFrequency}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Playback Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isPlaying ? (
                  <Button onClick={startToneGeneration} className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Tone
                  </Button>
                ) : (
                  <Button
                    onClick={stopToneGeneration}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    <Square className="mr-2 h-5 w-5" />
                    Stop Tone
                  </Button>
                )}

                {isPlaying && (
                  <Button
                    onClick={emergencyStop}
                    variant="outline"
                    className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Emergency Stop (ESC)
                  </Button>
                )}

                {isPlaying && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Tone active</span>
                    {channel === "left" && <Badge variant="outline">L</Badge>}
                    {channel === "right" && <Badge variant="outline">R</Badge>}
                    {channel === "stereo" && <Badge variant="outline">L+R</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <p className="text-xs text-gray-400">
                      Use basic controls above for standard tone generation. Switch to Advanced tab
                      for sweep and burst modes.
                    </p>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Frequency Sweep</Label>
                        <Switch
                          checked={sweepEnabled}
                          onCheckedChange={setSweepEnabled}
                          disabled={isPlaying || isNoiseMode || burstEnabled}
                        />
                      </div>

                      {sweepEnabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-cyan-500/30">
                          <div>
                            <Label className="text-xs">Start Frequency (Hz)</Label>
                            <Input
                              type="number"
                              value={sweepStartFreq}
                              onChange={(e) => setSweepStartFreq(parseFloat(e.target.value) || minFreq)}
                              min={minFreq}
                              max={maxFreq}
                              disabled={isPlaying}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Frequency (Hz)</Label>
                            <Input
                              type="number"
                              value={sweepEndFreq}
                              onChange={(e) => setSweepEndFreq(parseFloat(e.target.value) || maxFreq)}
                              min={minFreq}
                              max={maxFreq}
                              disabled={isPlaying}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duration (seconds)</Label>
                            <Input
                              type="number"
                              value={sweepDuration}
                              onChange={(e) => setSweepDuration(parseFloat(e.target.value) || 1)}
                              min={1}
                              max={300}
                              disabled={isPlaying}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Curve Type</Label>
                            <Select
                              value={sweepCurve}
                              onValueChange={(v) => setSweepCurve(v as SweepCurve)}
                              disabled={isPlaying}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="linear">Linear</SelectItem>
                                <SelectItem value="logarithmic">Logarithmic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Burst Mode</Label>
                        <Switch
                          checked={burstEnabled}
                          onCheckedChange={setBurstEnabled}
                          disabled={isPlaying || sweepEnabled}
                        />
                      </div>

                      {burstEnabled && (
                        <div className="space-y-3 pl-4 border-l-2 border-violet-500/30">
                          <div>
                            <Label className="text-xs">On Duration (ms)</Label>
                            <Input
                              type="number"
                              value={burstOnDuration}
                              onChange={(e) => setBurstOnDuration(parseFloat(e.target.value) || 100)}
                              min={10}
                              max={10000}
                              disabled={isPlaying}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Off Duration (ms)</Label>
                            <Input
                              type="number"
                              value={burstOffDuration}
                              onChange={(e) => setBurstOffDuration(parseFloat(e.target.value) || 100)}
                              min={10}
                              max={10000}
                              disabled={isPlaying}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Safety Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-300/80 space-y-2">
            <p>
              This tone generator produces audio signals that can damage equipment or hearing at high
              volumes. Always:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Start with low volume and gradually increase</li>
              <li>Use appropriate hearing protection when testing speakers at high levels</li>
              <li>Verify equipment ratings before applying test tones</li>
              <li>Press ESC or click Emergency Stop to immediately halt output</li>
              <li>This tool is for reference only and not a substitute for calibrated equipment</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showSafetyWarning} onOpenChange={setShowSafetyWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Safety Warning
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p className="text-gray-300">
                You are about to generate an audio signal. High volume output can:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                <li>Damage speakers, amplifiers, or other audio equipment</li>
                <li>Cause permanent hearing loss or injury</li>
                <li>Create discomfort or pain at high sound pressure levels</li>
              </ul>
              <p className="text-amber-300 font-medium">
                Ensure your output volume is set to a safe level before proceeding.
              </p>
              <p className="text-gray-400 text-xs">
                Press ESC at any time to immediately stop the tone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSafetyWarning(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAndStart} className="bg-gradient-to-r from-cyan-500 to-violet-500">
              I Understand, Start Tone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolShell>
  );
}
