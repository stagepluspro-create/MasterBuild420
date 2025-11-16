"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import {
  Play,
  Square,
  AlertTriangle,
  Mic,
  Activity,
  BarChart3,
  Settings2,
  Download,
  RotateCcw,
  Save,
  Smartphone,
  Shield,
  Clock,
} from "lucide-react";
import { SPLAudioEngine, SPLMeasurement, WeightingType, ResponseMode } from "./spl-audio-engine";
import { ComplianceCalculator } from "./compliance-calculator";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const WEIGHTING_OPTIONS: { value: WeightingType; label: string; description: string }[] = [
  { value: "A", label: "A-Weighting", description: "Human hearing response" },
  { value: "C", label: "C-Weighting", description: "Broadband response" },
  { value: "Z", label: "Z-Weighting", description: "Flat/unweighted" },
];

const RESPONSE_OPTIONS: { value: ResponseMode; label: string; description: string }[] = [
  { value: "fast", label: "Fast", description: "125ms averaging" },
  { value: "slow", label: "Slow", description: "1s averaging" },
  { value: "impulse", label: "Impulse", description: "35ms peak" },
];

const OCTAVE_BANDS = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export default function SPLMeter() {
  const { user } = useAuth();
  const engineRef = useRef<SPLAudioEngine>(new SPLAudioEngine());
  const complianceRef = useRef<ComplianceCalculator>(new ComplianceCalculator());
  const updateIntervalRef = useRef<number | null>(null);
  const measurementBufferRef = useRef<SPLMeasurement[]>([]);

  const [isRunning, setIsRunning] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");

  const [weighting, setWeighting] = useState<WeightingType>("A");
  const [responseMode, setResponseMode] = useState<ResponseMode>("fast");
  const [calibrationOffset, setCalibrationOffset] = useState(0);

  const [currentMeasurement, setCurrentMeasurement] = useState<SPLMeasurement | null>(null);
  const [history, setHistory] = useState<SPLMeasurement[]>([]);
  const [maxLevel, setMaxLevel] = useState(-Infinity);
  const [minLevel, setMinLevel] = useState(Infinity);
  const [avgLevel, setAvgLevel] = useState(0);

  const [sessionName, setSessionName] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceData, setComplianceData] = useState<any>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    engineRef.current.setMeasurementCallback(handleMeasurement);

    return () => {
      engineRef.current.cleanup();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      updateIntervalRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleMeasurement = useCallback((measurement: SPLMeasurement) => {
    setCurrentMeasurement(measurement);

    setHistory((prev) => {
      const newHistory = [...prev, measurement];
      if (newHistory.length > 60) {
        newHistory.shift();
      }
      return newHistory;
    });

    setMaxLevel((prev) => Math.max(prev, measurement.dbInstant));
    setMinLevel((prev) => (prev === Infinity ? measurement.dbInstant : Math.min(prev, measurement.dbInstant)));

    if (measurementBufferRef.current) {
      measurementBufferRef.current.push(measurement);
    }

    complianceRef.current.addExposure(measurement.dbInstant, 0.125);
  }, []);

  const startMeter = () => {
    setShowSafetyWarning(true);
  };

  const confirmAndStart = async () => {
    setShowSafetyWarning(false);
    setError("");

    try {
      await engineRef.current.start({
        weighting,
        responseMode,
        calibrationOffset,
        referenceLevel: 0.00002,
      });

      complianceRef.current.startSession();
      setIsRunning(true);
      resetStatistics();
    } catch (err: any) {
      setError(err.message || "Failed to access microphone");
      console.error("SPL Meter error:", err);
    }
  };

  const stopMeter = () => {
    engineRef.current.stop();
    setIsRunning(false);

    if (isRecording) {
      saveSession();
    }
  };

  const resetStatistics = () => {
    engineRef.current.resetStatistics();
    complianceRef.current.reset();
    setHistory([]);
    setMaxLevel(-Infinity);
    setMinLevel(Infinity);
    setAvgLevel(0);
    setCurrentMeasurement(null);
  };

  const resetPeak = () => {
    engineRef.current.resetPeak();
    setMaxLevel(-Infinity);
  };

  const startRecording = () => {
    if (!isRunning) return;

    measurementBufferRef.current = [];
    setIsRecording(true);
    setRecordingDuration(0);
    setShowSaveDialog(true);
  };

  const saveSession = async () => {
    if (!user || !isRecording) return;

    try {
      const oshaTWA = complianceRef.current.calculateOSHATWA();
      const nioshTWA = complianceRef.current.calculateNIOSHTWA();
      const euTWA = complianceRef.current.calculateEUExposure();

      const { data: session, error: sessionError } = await supabase
        .from("spl_sessions")
        .insert({
          user_id: user.id,
          name: sessionName || `SPL Session ${new Date().toLocaleString()}`,
          location: sessionLocation || null,
          start_time: new Date(Date.now() - recordingDuration * 1000).toISOString(),
          end_time: new Date().toISOString(),
          weighting,
          response_mode: responseMode,
          calibration_offset: calibrationOffset,
          max_level: maxLevel,
          min_level: minLevel === Infinity ? null : minLevel,
          avg_level: avgLevel,
          leq: currentMeasurement?.leq || null,
          osha_twa: oshaTWA.twa,
          niosh_twa: nioshTWA.twa,
          eu_twa: euTWA.twa,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (session && measurementBufferRef.current.length > 0) {
        const measurements = measurementBufferRef.current.map((m) => ({
          session_id: session.id,
          timestamp: new Date(m.timestamp).toISOString(),
          db_instant: m.dbInstant,
          db_slow: m.dbSlow,
          db_peak: m.dbPeak,
          db_a: m.dbA,
          db_c: m.dbC,
          db_z: m.dbZ,
          leq: m.leq,
          frequency_bands: m.frequencyBands ? { bands: m.frequencyBands } : null,
        }));

        const { error: measurementsError } = await supabase
          .from("spl_measurements")
          .insert(measurements);

        if (measurementsError) throw measurementsError;
      }

      setSessionId(session.id);
      setIsRecording(false);
      setShowSaveDialog(false);
      setSessionName("");
      setSessionLocation("");
    } catch (err) {
      console.error("Failed to save session:", err);
      setError("Failed to save session");
    }
  };

  const exportCSV = () => {
    if (measurementBufferRef.current.length === 0) return;

    const headers = ["Timestamp", "dB(Instant)", "dB(Slow)", "dB(Peak)", "dB(A)", "dB(C)", "dB(Z)", "Leq"];
    const rows = measurementBufferRef.current.map((m) => [
      new Date(m.timestamp).toISOString(),
      m.dbInstant.toFixed(1),
      m.dbSlow.toFixed(1),
      m.dbPeak.toFixed(1),
      m.dbA.toFixed(1),
      m.dbC.toFixed(1),
      m.dbZ.toFixed(1),
      m.leq.toFixed(1),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spl-session-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateCompliance = () => {
    if (!currentMeasurement) return;

    const compliance = complianceRef.current.getComplianceStatus(
      currentMeasurement.dbInstant,
      currentMeasurement.dbPeak
    );

    const oshaTWA = complianceRef.current.calculateOSHATWA();
    const nioshTWA = complianceRef.current.calculateNIOSHTWA();
    const euTWA = complianceRef.current.calculateEUExposure();

    setComplianceData({
      compliance,
      oshaTWA,
      nioshTWA,
      euTWA,
    });

    setShowCompliance(true);
  };

  useEffect(() => {
    if (history.length > 0) {
      const sum = history.reduce((acc, m) => acc + m.dbInstant, 0);
      setAvgLevel(sum / history.length);
    }
  }, [history]);

  const getLevelColor = (level: number): string => {
    if (level >= 100) return "text-red-400";
    if (level >= 85) return "text-amber-400";
    return "text-green-400";
  };

  const getLevelBgColor = (level: number): string => {
    if (level >= 100) return "from-red-500/20 to-red-600/20";
    if (level >= 85) return "from-amber-500/20 to-amber-600/20";
    return "from-cyan-500/20 to-cyan-600/20";
  };

  const getCurrentState = () => ({
    weighting,
    responseMode,
    calibrationOffset,
  });

  const handleLoadPreset = (data: any) => {
    if (isRunning) stopMeter();

    if (data.weighting) setWeighting(data.weighting);
    if (data.responseMode) setResponseMode(data.responseMode);
    if (data.calibrationOffset !== undefined) setCalibrationOffset(data.calibrationOffset);
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentLevel = currentMeasurement?.dbInstant || 0;
  const displayLevel = weighting === "A" ? currentMeasurement?.dbA : weighting === "C" ? currentMeasurement?.dbC : currentMeasurement?.dbZ;

  return (
    <ToolShell
      toolId="spl-meter"
      toolName="SPL Meter"
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
              Measurements are indicative only. Microphone quality and device calibration affect accuracy.
              For professional measurements, use calibrated equipment.
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-cyan-400" />
                  Sound Pressure Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`p-8 rounded-2xl bg-gradient-to-br ${getLevelBgColor(currentLevel)} border border-white/10`}>
                  <div className="text-center">
                    <div className={`text-8xl font-bold ${getLevelColor(currentLevel)} mb-2 transition-all`}>
                      {isRunning ? (displayLevel || 0).toFixed(1) : "--"}
                    </div>
                    <div className="text-2xl text-gray-400">dB {weighting !== "Z" ? `(${weighting})` : ""}</div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                      <div className="text-gray-400">
                        Peak: <span className={getLevelColor(maxLevel)}>{maxLevel === -Infinity ? "--" : maxLevel.toFixed(1)}</span> dB
                      </div>
                      <div className="text-gray-400">
                        Avg: <span className="text-cyan-400">{avgLevel > 0 ? avgLevel.toFixed(1) : "--"}</span> dB
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="glass-panel p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">dB(A)</div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {isRunning && currentMeasurement ? currentMeasurement.dbA.toFixed(1) : "--"}
                    </div>
                  </div>
                  <div className="glass-panel p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">dB(C)</div>
                    <div className="text-2xl font-bold text-violet-400">
                      {isRunning && currentMeasurement ? currentMeasurement.dbC.toFixed(1) : "--"}
                    </div>
                  </div>
                  <div className="glass-panel p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">Leq</div>
                    <div className="text-2xl font-bold text-magenta-400">
                      {isRunning && currentMeasurement ? currentMeasurement.leq.toFixed(1) : "--"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Level History (60s)</Label>
                    {history.length > 0 && (
                      <Badge variant="outline">{history.length} samples</Badge>
                    )}
                  </div>
                  <div className="h-32 glass-panel p-4 flex items-end gap-1">
                    {history.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                        No data yet
                      </div>
                    ) : (
                      history.map((m, i) => {
                        const height = Math.max(5, ((m.dbInstant + 60) / 140) * 100);
                        const color = m.dbInstant >= 100 ? "bg-red-500" : m.dbInstant >= 85 ? "bg-amber-500" : "bg-cyan-500";
                        return (
                          <div
                            key={i}
                            className={`flex-1 ${color} rounded-t transition-all`}
                            style={{ height: `${height}%` }}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-400" />
                  Octave Band Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {OCTAVE_BANDS.map((freq, i) => {
                    const level = currentMeasurement?.frequencyBands?.[i] || -60;
                    const normalizedLevel = Math.max(0, ((level + 60) / 120) * 100);
                    return (
                      <div key={freq} className="flex items-center gap-3">
                        <div className="w-16 text-xs text-gray-400 text-right">
                          {freq >= 1000 ? `${freq / 1000}k` : freq} Hz
                        </div>
                        <div className="flex-1">
                          <Progress value={normalizedLevel} className="h-2" />
                        </div>
                        <div className="w-12 text-xs text-gray-400">
                          {level > -60 ? level.toFixed(0) : "--"} dB
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Measurement Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isRunning ? (
                  <Button onClick={startMeter} className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Meter
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopMeter} variant="destructive" className="w-full" size="lg">
                      <Square className="mr-2 h-5 w-5" />
                      Stop Meter
                    </Button>
                    <Button onClick={resetPeak} variant="outline" className="w-full">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Peak
                    </Button>
                  </>
                )}

                {isRunning && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Meter active</span>
                    <Badge variant="outline">{weighting}</Badge>
                    <Badge variant="outline">{responseMode}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Weighting Filter</Label>
                  <Select
                    value={weighting}
                    onValueChange={(v) => setWeighting(v as WeightingType)}
                    disabled={isRunning}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHTING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <div>{opt.label}</div>
                            <div className="text-xs text-gray-400">{opt.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Response Mode</Label>
                  <Select
                    value={responseMode}
                    onValueChange={(v) => setResponseMode(v as ResponseMode)}
                    disabled={isRunning}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESPONSE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <div>{opt.label}</div>
                            <div className="text-xs text-gray-400">{opt.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Calibration Offset</Label>
                    <span className="text-sm text-gray-400">{calibrationOffset > 0 ? "+" : ""}{calibrationOffset.toFixed(1)} dB</span>
                  </div>
                  <Slider
                    value={[calibrationOffset]}
                    onValueChange={(v) => setCalibrationOffset(v[0])}
                    min={-20}
                    max={20}
                    step={0.1}
                    disabled={isRunning}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Adjust to match a calibrated reference meter
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isRecording ? (
                  <Button onClick={startRecording} disabled={!isRunning || !user} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <>
                    <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-2xl font-mono font-bold text-red-400">
                        {formatDuration(recordingDuration)}
                      </div>
                      <div className="text-xs text-red-300 mt-1">Recording...</div>
                    </div>
                    <Button onClick={saveSession} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Stop & Save
                    </Button>
                  </>
                )}

                {history.length > 0 && (
                  <Button onClick={exportCSV} variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={updateCompliance} disabled={!isRunning} className="w-full" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  View Compliance Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Important Safety Information
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-amber-300/80 space-y-2">
            <p className="font-semibold">
              This tool provides INDICATIVE measurements only and is NOT a calibrated sound level meter.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Measurements depend on device microphone quality and may not be accurate</li>
              <li>Do NOT use for legal compliance, workplace safety certification, or official reporting</li>
              <li>Always use Type 1 or Type 2 calibrated SPL meters for professional measurements</li>
              <li>Prolonged exposure above 85 dB can cause permanent hearing damage</li>
              <li>Use proper hearing protection in high-noise environments</li>
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
                You are about to start sound pressure level measurement.
              </p>
              <p className="text-amber-300 font-medium">
                This tool provides INDICATIVE measurements only. Results are NOT calibrated and should NOT be used for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-400 ml-2">
                <li>Legal compliance or official reporting</li>
                <li>Workplace safety certification (OSHA, NIOSH, EU)</li>
                <li>Noise ordinance enforcement</li>
                <li>Professional acoustic measurements</li>
              </ul>
              <p className="text-gray-400 text-xs">
                Always use calibrated Type 1 or Type 2 sound level meters for professional work.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSafetyWarning(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAndStart} className="bg-gradient-to-r from-cyan-500 to-violet-500">
              I Understand, Start Meter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Recording Session</DialogTitle>
            <DialogDescription>
              Provide details for this measurement session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Main Stage Soundcheck"
              />
            </div>
            <div>
              <Label htmlFor="session-location">Location (Optional)</Label>
              <Input
                id="session-location"
                value={sessionLocation}
                onChange={(e) => setSessionLocation(e.target.value)}
                placeholder="e.g., Arena Floor Center"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveSession}>
              Continue Recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompliance} onOpenChange={setShowCompliance}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Compliance Status
            </DialogTitle>
          </DialogHeader>
          {complianceData && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">OSHA TWA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-cyan-400">
                      {complianceData.oshaTWA.twa.toFixed(1)} dB
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Dose: {complianceData.oshaTWA.dose.toFixed(1)}%
                    </div>
                    <Badge variant={complianceData.oshaTWA.isCompliant ? "outline" : "destructive"} className="mt-2">
                      {complianceData.oshaTWA.isCompliant ? "Compliant" : "Over Limit"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">NIOSH TWA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-violet-400">
                      {complianceData.nioshTWA.twa.toFixed(1)} dB
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Dose: {complianceData.nioshTWA.dose.toFixed(1)}%
                    </div>
                    <Badge variant={complianceData.nioshTWA.isCompliant ? "outline" : "destructive"} className="mt-2">
                      {complianceData.nioshTWA.isCompliant ? "Compliant" : "Over Limit"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">EU Exposure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-magenta-400">
                      {complianceData.euTWA.twa.toFixed(1)} dB
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Dose: {complianceData.euTWA.dose.toFixed(1)}%
                    </div>
                    <Badge variant={complianceData.euTWA.isCompliant ? "outline" : "destructive"} className="mt-2">
                      {complianceData.euTWA.isCompliant ? "Compliant" : "Over Limit"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {complianceData.compliance.warnings.length > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-400">Warnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-amber-300">
                      {complianceData.compliance.warnings.map((w: string, i: number) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {complianceData.compliance.recommendations.length > 0 && (
                <Card className="border-cyan-500/30 bg-cyan-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-cyan-400">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-cyan-300">
                      {complianceData.compliance.recommendations.map((r: string, i: number) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-gray-400 text-center">
                These compliance calculations are for reference only. Consult safety professionals for official assessments.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowCompliance(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolShell>
  );
}
