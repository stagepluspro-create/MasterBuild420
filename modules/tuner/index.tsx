"use client";

import { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  ExternalLink,
  Gauge,
  Info,
} from "lucide-react";
import { TunerEngine, TunerResult } from "./tuner-engine";

const INSTRUMENT_PRESETS = [
  {
    name: "Guitar (Standard)",
    tuning: [
      { note: "E", octave: 2 },
      { note: "A", octave: 2 },
      { note: "D", octave: 3 },
      { note: "G", octave: 3 },
      { note: "B", octave: 3 },
      { note: "E", octave: 4 },
    ],
  },
  {
    name: "Bass (Standard)",
    tuning: [
      { note: "E", octave: 1 },
      { note: "A", octave: 1 },
      { note: "D", octave: 2 },
      { note: "G", octave: 2 },
    ],
  },
  {
    name: "Violin",
    tuning: [
      { note: "G", octave: 3 },
      { note: "D", octave: 4 },
      { note: "A", octave: 4 },
      { note: "E", octave: 5 },
    ],
  },
  {
    name: "Ukulele",
    tuning: [
      { note: "G", octave: 4 },
      { note: "C", octave: 4 },
      { note: "E", octave: 4 },
      { note: "A", octave: 4 },
    ],
  },
];

export default function Tuner() {
  const engineRef = useRef<TunerEngine>(new TunerEngine());
  const animationFrameRef = useRef<number | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [referenceFreq, setReferenceFreq] = useState(440);

  const [tunerResult, setTunerResult] = useState<TunerResult | null>(null);
  const [signalStrength, setSignalStrength] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [autoDetect, setAutoDetect] = useState(true);
  const [targetNote, setTargetNote] = useState<{ note: string; octave: number } | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      engineRef.current.cleanup();
    };
  }, []);

  const updateTunerData = () => {
    if (!isListening) return;

    const result = engineRef.current.detectPitch();
    const strength = engineRef.current.getSignalStrength();

    setTunerResult(result);
    setSignalStrength(strength);

    animationFrameRef.current = requestAnimationFrame(updateTunerData);
  };

  const startListening = async () => {
    try {
      setError("");
      await engineRef.current.initialize();
      engineRef.current.setReferenceFrequency(referenceFreq);
      setIsListening(true);
      updateTunerData();
    } catch (err: any) {
      setError(err.message || "Failed to access microphone");
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    engineRef.current.cleanup();
    setTunerResult(null);
    setSignalStrength(0);
  };

  const handleReferenceFreqChange = (freq: number) => {
    const clamped = Math.max(400, Math.min(460, freq));
    setReferenceFreq(clamped);
    if (isListening) {
      engineRef.current.setReferenceFrequency(clamped);
    }
  };

  const openToneGenerator = () => {
    window.open("/tools/tone-generator", "_blank");
  };

  const selectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    setAutoDetect(false);
  };

  const getCurrentState = () => ({
    referenceFreq,
    selectedPreset,
    autoDetect,
  });

  const handleLoadPreset = (data: any) => {
    if (isListening) stopListening();

    if (data.referenceFreq !== undefined) setReferenceFreq(data.referenceFreq);
    if (data.selectedPreset !== undefined) setSelectedPreset(data.selectedPreset);
    if (data.autoDetect !== undefined) setAutoDetect(data.autoDetect);
  };

  const getNeedleRotation = () => {
    if (!tunerResult) return 0;
    const maxDegrees = 45;
    const cents = Math.max(-50, Math.min(50, tunerResult.cents));
    return (cents / 50) * maxDegrees;
  };

  const getTuningStatus = () => {
    if (!tunerResult) return { text: "No signal", color: "text-gray-400" };
    if (tunerResult.inTune) return { text: "In Tune", color: "text-green-400" };
    if (tunerResult.cents < 0) return { text: "Flat", color: "text-red-400" };
    return { text: "Sharp", color: "text-red-400" };
  };

  const getSignalQuality = () => {
    if (signalStrength < 5) return { text: "Too quiet", color: "text-amber-400" };
    if (signalStrength > 90) return { text: "Clipping", color: "text-red-400" };
    return { text: "Good", color: "text-green-400" };
  };

  const renderNeedleMeter = () => {
    const rotation = getNeedleRotation();
    const status = getTuningStatus();

    return (
      <div className="relative w-full h-48 flex items-end justify-center">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          <defs>
            <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke="url(#meterGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />

          <line x1="20" y1="90" x2="30" y2="80" stroke="#ef4444" strokeWidth="2" />
          <line x1="50" y1="60" x2="55" y2="55" stroke="#fbbf24" strokeWidth="2" />
          <line x1="100" y1="50" x2="100" y2="45" stroke="#22c55e" strokeWidth="3" />
          <line x1="150" y1="60" x2="145" y2="55" stroke="#fbbf24" strokeWidth="2" />
          <line x1="180" y1="90" x2="170" y2="80" stroke="#ef4444" strokeWidth="2" />

          <g transform={`rotate(${rotation} 100 90)`}>
            <line
              x1="100"
              y1="90"
              x2="100"
              y2="30"
              stroke={status.text === "In Tune" ? "#22c55e" : "#9333ea"}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="100" cy="90" r="5" fill={status.text === "In Tune" ? "#22c55e" : "#9333ea"} />
          </g>

          <text x="100" y="95" textAnchor="middle" fill="currentColor" fontSize="10" opacity="0.5">
            {tunerResult ? `${tunerResult.cents > 0 ? "+" : ""}${tunerResult.cents.toFixed(1)}¢` : "0¢"}
          </text>
        </svg>
      </div>
    );
  };

  const preset = selectedPreset
    ? INSTRUMENT_PRESETS.find((p) => p.name === selectedPreset)
    : null;

  return (
    <ToolShell
      toolId="tuner"
      toolName="Instrument Tuner"
      getCurrentState={getCurrentState}
      onLoad={handleLoadPreset}
    >
      <div className="space-y-6">
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Microphone Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-red-300/80">
              {error}. Please ensure microphone permissions are granted.
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-violet-400" />
                  Pitch Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div
                      className={`text-8xl font-bold transition-colors ${
                        tunerResult?.inTune ? "text-green-400" : "gradient-text"
                      }`}
                    >
                      {tunerResult ? tunerResult.note : "-"}
                      {tunerResult && <span className="text-4xl">{tunerResult.octave}</span>}
                    </div>
                    <div className="text-lg text-gray-400 mt-2">
                      {tunerResult ? `${tunerResult.frequency.toFixed(2)} Hz` : "No signal detected"}
                    </div>
                  </div>

                  {renderNeedleMeter()}

                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div
                      className={`px-4 py-2 rounded-full border ${
                        tunerResult && tunerResult.cents < -5
                          ? "border-red-500 bg-red-500/20 text-red-400"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      Flat
                    </div>
                    <div
                      className={`px-6 py-2 rounded-full border text-lg font-bold ${
                        tunerResult?.inTune
                          ? "border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/20"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      In Tune
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full border ${
                        tunerResult && tunerResult.cents > 5
                          ? "border-red-500 bg-red-500/20 text-red-400"
                          : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                    >
                      Sharp
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Signal Strength</Label>
                  <Progress value={signalStrength} className="h-3" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      Level: {signalStrength.toFixed(0)}%
                    </span>
                    <span className={`text-xs ${getSignalQuality().color}`}>
                      {getSignalQuality().text}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-cyan-400" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Reference Frequency (A4): {referenceFreq} Hz</Label>
                  <Slider
                    value={[referenceFreq]}
                    onValueChange={(v) => handleReferenceFreqChange(v[0])}
                    min={400}
                    max={460}
                    step={1}
                    disabled={isListening}
                    className="mb-3"
                  />
                  <Input
                    type="number"
                    value={referenceFreq}
                    onChange={(e) => handleReferenceFreqChange(parseFloat(e.target.value) || 440)}
                    min={400}
                    max={460}
                    disabled={isListening}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Standard tuning uses 440 Hz. Adjust if needed for ensemble tuning.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Auto Detect Mode</Label>
                  <Switch
                    checked={autoDetect}
                    onCheckedChange={(checked) => {
                      setAutoDetect(checked);
                      if (checked) setSelectedPreset(null);
                    }}
                  />
                </div>

                <Button
                  onClick={openToneGenerator}
                  variant="outline"
                  className="w-full"
                  disabled={isListening}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Play Reference Tone
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Microphone Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isListening ? (
                  <Button onClick={startListening} className="w-full" size="lg">
                    <Mic className="mr-2 h-5 w-5" />
                    Start Listening
                  </Button>
                ) : (
                  <Button onClick={stopListening} variant="destructive" className="w-full" size="lg">
                    <MicOff className="mr-2 h-5 w-5" />
                    Stop Listening
                  </Button>
                )}

                {isListening && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    <span>Listening...</span>
                    <Badge variant="outline">{referenceFreq} Hz</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Instrument Presets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {INSTRUMENT_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant={selectedPreset === preset.name ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => selectPreset(preset.name)}
                    disabled={isListening || autoDetect}
                  >
                    {preset.name}
                  </Button>
                ))}

                {selectedPreset && preset && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <div className="text-xs text-gray-400 mb-2">Target Notes:</div>
                    <div className="flex flex-wrap gap-2">
                      {preset.tuning.map((string, idx) => (
                        <Badge key={idx} variant="outline">
                          {string.note}
                          {string.octave}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-violet-500/30 bg-violet-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-violet-400">
                  <Info className="h-4 w-4" />
                  Tuning Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-violet-300/80 space-y-2">
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Play one string at a time clearly</li>
                  <li>Tune in a quiet environment for best accuracy</li>
                  <li>Green indicator means within ±5 cents</li>
                  <li>Use reference tone to calibrate your ear</li>
                  <li>Ensure adequate signal strength for accuracy</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Accuracy Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-300/80">
            This tuner is for reference and practice use only. Results may vary based on microphone
            quality, ambient noise, and device capabilities. For professional tuning, use a
            dedicated calibrated tuner.
          </CardContent>
        </Card>
      </div>
    </ToolShell>
  );
}
