// ==========================================
//  Audio Engine - Improved & Stable Version
// ==========================================

export type WaveformType = "sine" | "square" | "triangle" | "sawtooth" | "white" | "pink";
export type ChannelMode = "stereo" | "left" | "right";
export type SweepCurve = "linear" | "logarithmic";

export interface ToneConfig {
  frequency: number;
  waveform: WaveformType;
  volume: number;
  channel: ChannelMode;
}

export interface SweepConfig {
  startFreq: number;
  endFreq: number;
  duration: number;
  curve: SweepCurve;
}

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

  // ------------------------------------------
  // Initialize AudioContext
  // ------------------------------------------
  initialize(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  // ------------------------------------------
  // Create White/Pink Noise Buffer
  // ------------------------------------------
  private createNoiseBuffer(type: "white" | "pink"): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else {
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

  // ------------------------------------------
  // Start Tone (normal)
  // ------------------------------------------
  startTone(
    config: ToneConfig,
    maxVolume: number = 1.0,
    durationMs: number | null = null
  ): void {
    this.stop();

    const ctx = this.initialize();

    this.gainNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.analyser = ctx.createAnalyser();

    // Gain ramp to avoid pops
    const targetVolume = Math.min(config.volume, maxVolume);
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.15);

    // Channels
    this.panNode.pan.value =
      config.channel === "left" ? -1 :
      config.channel === "right" ? 1 : 0;

    // Oscillator or Noise
    if (config.waveform === "white" || config.waveform === "pink") {
      this.isNoiseMode = true;
      const buffer = this.createNoiseBuffer(config.waveform);
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.gainNode);
      this.noiseSource.start();
    } else {
      this.isNoiseMode = false;
      this.oscillator = ctx.createOscillator();
      this.oscillator.type = config.waveform;
      this.oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();
    }

    this.gainNode.connect(this.panNode);
    this.panNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Auto-stop handler
    if (durationMs && durationMs > 0) {
      setTimeout(() => {
        this.stop();
      }, durationMs);
    }
  }

  // ------------------------------------------
  // Start Frequency Sweep
  // ------------------------------------------
  startSweep(
    config: ToneConfig,
    sweepConfig: SweepConfig,
    maxVolume: number = 1.0
  ) {
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

      let nextFreq =
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

  // ------------------------------------------
  // Burst Mode
  // ------------------------------------------
  startBurst(
    config: ToneConfig,
    onDuration: number,
    offDuration: number,
    maxVolume: number = 1.0
  ): void {
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

  // ------------------------------------------
  // Live Adjustments
  // ------------------------------------------
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

  // ------------------------------------------
  // Analyser Data
  // ------------------------------------------
  getAnalyserData(): Uint8Array | null {
    if (!this.analyser) return null;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  getCurrentFrequency(): number {
    return this.oscillator && !this.isNoiseMode ? this.oscillator.frequency.value : 0;
  }

  // ------------------------------------------
  // Cleanup
  // ------------------------------------------
  private cleanupAudioNodes(): void {
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + 0.1
      );
    }

    setTimeout(() => {
      if (this.oscillator) {
        try { this.oscillator.stop(); } catch {}
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      if (this.noiseSource) {
        try { this.noiseSource.stop(); } catch {}
        this.noiseSource.disconnect();
        this.noiseSource = null;
      }

      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }

      if (this.panNode) {
        this.panNode.disconnect();
        this.panNode = null;
      }

      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }
    }, 120);
  }

  stop(): void {
    this.stopSweep();
    this.stopBurst();
    this.cleanupAudioNodes();
  }

  cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
