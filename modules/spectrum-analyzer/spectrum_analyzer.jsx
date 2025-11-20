"use client";

import React, { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/tool-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

/**
 * Full Audio Analysis Suite
 * ✔ Frequency Spectrum Analyzer (FFT)
 * ✔ RMS Level Meter (Fast + Slow)
 * ✔ Spectrogram Waterfall (Scrolling)
 *
 * Production-ready for Bolt.new — optimized WebAudio + Canvas rendering.
 */

const FFT_OPTIONS = [512, 1024, 2048, 4096, 8192];

export default function AudioSuite() {
  // Refs
  const spectrumCanvas = useRef<HTMLCanvasElement | null>(null);
  const spectrogramCanvas = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timeAnalyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // State
  const [running, setRunning] = useState(false);
  const [fftSize, setFftSize] = useState(2048);
  const [smoothing, setSmoothing] = useState(0.8);
  const [rmsFast, setRmsFast] = useState(0);
  const [rmsSlow, setRmsSlow] = useState(0);

  // Init Audio
  const initAudio = async () => {
    if (running) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AC();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;

      const timeAnalyser = audioCtx.createAnalyser();
      timeAnalyser.fftSize = 2048;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      source.connect(timeAnalyser);

      streamRef.current = stream;
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      timeAnalyserRef.current = timeAnalyser;

      setRunning(true);
      startDrawing();
    } catch (e) {
      alert("Microphone access required.");
      console.error(e);
    }
  };

  const stopAudio = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    setRunning(false);
  };

  // Core drawing loop (spectrum + RMS + spectrogram)
  const draw = () => {
    drawSpectrum();
    drawRMS();
    drawSpectrogram();
    rafRef.current = requestAnimationFrame(draw);
  };

  const startDrawing = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  // ---------------------------
  // Spectrum Analyzer
  // ---------------------------
  const drawSpectrum = () => {
    const canvas = spectrumCanvas.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);

    ctx.clearRect(0, 0, width, height);

    const barWidth = Math.max(1, width / buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      const value = buffer[i];
      const barHeight = (value / 255) * height;
      const hue = (i / buffer.length) * 260;

      ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
    }
  };

  // ---------------------------
  // RMS Level Meter (FAST + SLOW)
  // ---------------------------
  const drawRMS = () => {
    const analyser = timeAnalyserRef.current;
    const audioCtx = audioCtxRef.current;
    if (!analyser || !audioCtx) return;

    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    // Compute RMS
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
    const rms = Math.sqrt(sum / buffer.length);

    // Fast meter reacts quickly
    setRmsFast(rms);

    // Slow meter averages
    setRmsSlow((prev) => prev * 0.8 + rms * 0.2);
  };

  // ---------------------------
  // Spectrogram Waterfall (Scrolling)
  // ---------------------------
  const drawSpectrogram = () => {
    const canvas = spectrogramCanvas.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);

    // scroll image down
    ctx.drawImage(canvas, 0, 1, width, height - 1);

    // draw newest FFT row at top
    for (let i = 0; i < buffer.length; i++) {
      const value = buffer[i] / 255;
      const hue = (i / buffer.length) * 260;
      ctx.fillStyle = `hsl(${hue}, 100%, ${value * 60 + 10}%)`;
      ctx.fillRect(i * (width / buffer.length), 0, width / buffer.length, 1);
    }
  };

  // On unmount
  useEffect(() => () => stopAudio(), []);

  return (
    <ToolShell toolId="audio-suite" toolName="Audio Analyzer" getCurrentState={() => ({})} onLoad={() => {}}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Spectrum Analyzer + RMS Meter + Spectrogram</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap mb-4">
              <Button onClick={() => (running ? stopAudio() : initAudio())}>
                {running ? "Stop" : "Start"}
              </Button>

              <div className="flex items-center gap-2">
                <Label>FFT</Label>
                <select
                  value={fftSize}
                  onChange={(e) => setFftSize(parseInt(e.target.value))}
                  className="bg-gray-800 text-white px-2 py-1 rounded"
                >
                  {FFT_OPTIONS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Smoothing</Label>
                <input
                  type="range"
                  min={0}
                  max={0.99}
                  step={0.01}
                  value={smoothing}
                  onChange={(e) => setSmoothing(parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* RMS */}
            <div className="mb-4">
              <div className="text-white text-sm mb-1">RMS Level</div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-black/50 h-3 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-400 transition-all"
                    style={{ width: `${Math.min(100, rmsFast * 300)}%` }}
                  />
                </div>
                <div className="flex-1 bg-black/50 h-3 rounded overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${Math.min(100, rmsSlow * 300)}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Left: Fast RMS • Right: Slow RMS
              </div>
            </div>

            {/* Spectrum */}
            <div className="w-full h-64 bg-black/70 border border-white/10 rounded mb-4">
              <canvas ref={spectrumCanvas} style={{ width: "100%", height: "100%" }} />
            </div>

            {/* Spectrogram */}
            <div className="w-full h-64 bg-black border border-white/10 rounded overflow-hidden">
              <canvas ref={spectrogramCanvas} style={{ width: "100%", height: "100%" }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolShell>
  );
}