// audio-engine.ts
// Full AudioEngine with RMS meter + True FFT Spectrum Analyzer
// Compatible with the React UI you provided earlier.

export type WaveformType = "sine" | "square" | "triangle" | "sawtooth" | "white" | "pink";
export type ChannelMode = "stereo" | "left" | "right";
export type SweepCurve = "linear" | "logarithmic";

export interface ToneConfig {
  frequency: number;
  waveform: WaveformType;
  volume: number; // linear 0..1
  channel: ChannelMode;
}

export interface SweepConfig {
  startFreq: number;
  endFreq: number;
  duration: number; // seconds
  curve: SweepCurve;
}

export type AnalyserCallback = (payload: {
  rms: number; // linear 0..1
  rmsDb: number; // dBFS (negative, -Infinity for silence)
  spectrum: Float32Array; // dB values, length = frequencyBinCount
  timeDomain: Float32Array; // float samples -1..1
}) => void;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private panNode: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  private isNoiseMode: boolean = false;
  private sweepInterval: number | null = null;
  private burstInterval: number | null = null;

  // Metering / analyser
  private analysing: boolean = false;
  private analyserRafId: number | null = null;
  private analyserSubscribers = new Set<AnalyserCallback>();
  private lastRms: number = 0;
  private lastSpectrum: Float32Array | null = null;
  private rmsSmoothing = 0.8; // exponential smoothing factor for RMS (0..1)

  // default analyser settings
  private analyserFftSize = 2048;
  private analyserSmoothingTimeConstant = 0.8;

  // ---------------------------
  // Initialize AudioContext
  // ---------------------------
  initialize(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // ---------------------------
  // Noise buffer generator
  // ---------------------------
  private createNoiseBuffer(type: "white" | "pink"): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    } else {
      // Voss-McCartney style pink-ish generator (simple IIR)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // ---------------------------
  // Internal: setup analyser nodes
  // ---------------------------
  private ensureAnalyser(): AnalyserNode {
    if (!this.analyser) {
      const ctx = this.initialize();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = this.analyserFftSize;
      this.analyser.smoothingTimeConstant = this.analyserSmoothingTimeConstant;
    }
    return this.analyser;
  }

  public configureAnalyser(fftSize: number, smoothingTimeConstant: number) {
    // fftSize must be power of two between 32 and 32768
    if (!Number.isInteger(fftSize) || (fftSize & (fftSize - 1)) !== 0) {
      console.warn("FFT size must be power of two. Keeping previous value.");
    } else {
      this.analyserFftSize = fftSize;
    }
    this.analyserSmoothingTimeConstant = Math.max(0, Math.min(1, smoothingTimeConstant));
    if (this.analyser) {
      this.analyser.fftSize = this.analyserFftSize;
      this.analyser.smoothingTimeConstant = this.analyserSmoothingTimeConstant;
    }
  }

  // ---------------------------
  // Start Tone (supports duration auto-stop)
  // ---------------------------
  startTone(config: ToneConfig, maxVolume: number = 1.0, durationMs: number | null = null): void {
    this.stop();

    const ctx = this.initialize();

    this.gainNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.analyser = this.ensureAnalyser();

    // set analyser smoothing & fftsize if updated
    this.analyser.fftSize = this.analyserFftSize;
    this.analyser.smoothingTimeConstant = this.analyserSmoothingTimeConstant;

    // gain ramp to avoid clicks
    const targetVolume = Math.min(config.volume, maxVolume);
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.15);

    // channel routing
    this.panNode.pan.value = config.channel === "left" ? -1 : config.channel === "right" ? 1 : 0;

    if (config.waveform === "white" || config.waveform === "pink") {
      this.isNoiseMode = true;
      const buffer = this.createNoiseBuffer(config.waveform);
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.gainNode);
      // connect through pan + analyser below
      this.noiseSource.start();
    } else {
      this.isNoiseMode = false;
      this.oscillator = ctx.createOscillator();
      this.oscillator.type = config.waveform;
      this.oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
    }

    // connect graph: gain -> pan -> analyser -> destination
    this.gainNode.connect(this.panNode);
    this.panNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // if the app wants to start metering automatically, keep analyser active
    if (this.analyserSubscribers.size > 0) {
      this.startMetering(); // will not double-start
    }

    // auto-stop support
    if (durationMs && durationMs > 0) {
      setTimeout(() => {
        this.stop();
      }, durationMs);
    }
  }

  // ---------------------------
  // Sweep
  // ---------------------------
  startSweep(config: ToneConfig, sweepConfig: SweepConfig, maxVolume: number = 1.0) {
    this.startTone(config, maxVolume);

    if (!this.audioContext || !this.oscillator || this.isNoiseMode) return;

    const { startFreq, endFreq, duration, curve } = sweepConfig;
    const steps = 200;
    const stepDuration = (duration * 1000) / steps;
    let currentStep = 0;

    this.sweepInterval = window.setInterval(() => {
      if (!this.oscillator || !this.audioContext) {
        this.stopSweep();
        return;
      }
      currentStep++;
      const t = currentStep / steps;
      const nextFreq =
        curve === "logarithmic"
          ? Math.exp(Math.log(startFreq) + t * (Math.log(endFreq) - Math.log(startFreq)))
          : startFreq + t * (endFreq - startFreq);
      this.oscillator.frequency.setValueAtTime(nextFreq, this.audioContext.currentTime);
      if (currentStep >= steps) this.stopSweep();
    }, stepDuration);
  }

  stopSweep() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
  }

  // ---------------------------
  // Burst
  // ---------------------------
  startBurst(config: ToneConfig, onDuration: number, offDuration: number, maxVolume: number = 1.0) {
    this.stopBurst();

    let playing = false;

    const toggle = () => {
      if (playing) {
        this.cleanupAudioNodes();
        playing = false;
        this.burstInterval = window.setTimeout(toggle, offDuration);
      } else {
        this.startTone(config, maxVolume);
        playing = true;
        this.burstInterval = window.setTimeout(toggle, onDuration);
      }
    };

    toggle();
  }

  stopBurst() {
    if (this.burstInterval) {
      clearTimeout(this.burstInterval);
      this.burstInterval = null;
    }
  }

  // ---------------------------
  // Live adjustments
  // ---------------------------
  setFrequency(freq: number): void {
    if (this.oscillator && !this.isNoiseMode && this.audioContext) {
      this.oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
    }
  }

  setVolume(volume: number, maxVolume: number = 1.0): void {
    if (this.gainNode && this.audioContext) {
      const target = Math.min(volume, maxVolume);
      this.gainNode.gain.setValueAtTime(target, this.audioContext.currentTime);
    }
  }

  // ---------------------------
  // Metering: subscribe / unsubscribe
  // ---------------------------
  /**
   * Subscribe to analyser + RMS updates.
   * Returns an unsubscribe function.
   */
  subscribeAnalyser(cb: AnalyserCallback): () => void {
    this.analyserSubscribers.add(cb);
    // ensure analyser node exists & RAF loop running
    if (!this.analyser) {
      // create an analyser so subscription begins producing data even if not currently playing
      this.ensureAnalyser();
    }
    this.startMetering();
    return () => {
      this.analyserSubscribers.delete(cb);
      if (this.analyserSubscribers.size === 0) {
        this.stopMetering();
      }
    };
  }

  private startMetering() {
    if (this.analysing) return;
    this.analysing = true;

    const loop = () => {
      try {
        if (!this.analyser) {
          this.analyser = this.ensureAnalyser();
        }

        const analyser = this.analyser;
        const freqBinCount = analyser.frequencyBinCount;
        const timeDomain = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(timeDomain);

        // compute RMS (linear)
        let sumSq = 0;
        for (let i = 0; i < timeDomain.length; i++) {
          const s = timeDomain[i];
          sumSq += s * s;
        }
        const rawRms = Math.sqrt(sumSq / timeDomain.length) || 0;

        // smooth RMS a little for UI stability
        const smoothRms = this.rmsSmoothing * this.lastRms + (1 - this.rmsSmoothing) * rawRms;
        this.lastRms = smoothRms;

        const rmsDb = smoothRms > 0 ? 20 * Math.log10(smoothRms) : -Infinity;

        // get frequency-domain data: use Float32Array to get dB values
        const spectrum = new Float32Array(freqBinCount);
        // getFloatFrequencyData may return -Infinity for empty bins, which is fine
        analyser.getFloatFrequencyData(spectrum);
        this.lastSpectrum = spectrum;

        // emit to subscribers
        const payload = {
          rms: smoothRms,
          rmsDb,
          spectrum,
          timeDomain,
        };
        this.analyserSubscribers.forEach((s) => {
          try {
            s(payload);
          } catch (e) {
            // individual subscriber error shouldn't stop loop
            console.error("Analyser subscriber error:", e);
          }
        });
      } catch (e) {
        console.warn("Metering loop error:", e);
      }

      // next frame
      this.analyserRafId = requestAnimationFrame(loop);
    };

    this.analyserRafId = requestAnimationFrame(loop);
  }

  private stopMetering() {
    if (!this.analysing) return;
    this.analysing = false;
    if (this.analyserRafId !== null) {
      cancelAnimationFrame(this.analyserRafId);
      this.analyserRafId = null;
    }
  }

  // ---------------------------
  // Getters for latest values (polling)
  // ---------------------------
  getLatestRMS(): { rms: number; rmsDb: number } {
    // compute on-the-fly if analyser exists
    if (this.analyser) {
      const buf = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
      const rawRms = Math.sqrt(sumSq / buf.length) || 0;
      const rms = this.rmsSmoothing * this.lastRms + (1 - this.rmsSmoothing) * rawRms;
      return { rms, rmsDb: rms > 0 ? 20 * Math.log10(rms) : -Infinity };
    }
    return { rms: this.lastRms, rmsDb: this.lastRms > 0 ? 20 * Math.log10(this.lastRms) : -Infinity };
  }

  getLatestSpectrum(): Float32Array | null {
    if (this.analyser) {
      const spectrum = new Float32Array(this.analyser.frequencyBinCount);
      this.analyser.getFloatFrequencyData(spectrum);
      this.lastSpectrum = spectrum;
      return spectrum;
    }
    return this.lastSpectrum;
  }

  // ---------------------------
  // Utility: convert bin->frequency (sample rate aware)
  // ---------------------------
  getFrequencyForBin(binIndex: number): number {
    if (!this.audioContext || !this.analyser) return 0;
    const nyquist = this.audioContext.sampleRate / 2;
    return (binIndex / this.analyser.frequencyBinCount) * nyquist;
  }

  // ---------------------------
  // Analyser helpers for UI-friendly data
  // ---------------------------
  getSpectrumAsLinearMagnitudes(): Float32Array | null {
    // convert dB values to linear magnitude (0..1 scale relative)
    const dbSpec = this.getLatestSpectrum();
    if (!dbSpec) return null;
    const mags = new Float32Array(dbSpec.length);
    for (let i = 0; i < dbSpec.length; i++) {
      const db = dbSpec[i];
      // typical analyser range is -100 .. 0 dB
      const mag = db <= -100 ? 0 : Math.pow(10, db / 20);
      mags[i] = mag;
    }
    return mags;
  }

  // ---------------------------
  // Cleanup nodes
  // ---------------------------
  private cleanupAudioNodes(): void {
    if (this.gainNode && this.audioContext) {
      try {
        this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
      } catch (e) {
        // ignore
      }
    }

    setTimeout(() => {
      if (this.oscillator) {
        try {
          this.oscillator.stop();
        } catch {}
        try { this.oscillator.disconnect(); } catch {}
        this.oscillator = null;
      }

      if (this.noiseSource) {
        try {
          this.noiseSource.stop();
        } catch {}
        try { this.noiseSource.disconnect(); } catch {}
        this.noiseSource = null;
      }

      if (this.gainNode) {
        try { this.gainNode.disconnect(); } catch {}
        this.gainNode = null;
      }

      if (this.panNode) {
        try { this.panNode.disconnect(); } catch {}
        this.panNode = null;
      }

      // Keep analyser active while subscribers exist so metering can run even when
      // the tone is stopped (optional). If you want analyser to be removed, uncomment below:
      // if (this.analyser && this.analyserSubscribers.size === 0) {
      //   try { this.analyser.disconnect(); } catch {}
      //   this.analyser = null;
      // }
    }, 120);
  }

  stop(): void {
    this.stopSweep();
    this.stopBurst();
    this.cleanupAudioNodes();
  }

  cleanup(): void {
    this.stop();
    this.stopMetering();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }
}
