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

  initialize(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

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
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    }

    return buffer;
  }

  startTone(config: ToneConfig, maxVolume: number = 1.0): void {
    this.stop();

    const ctx = this.initialize();
    this.gainNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.analyser = ctx.createAnalyser();

    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    const targetVolume = Math.min(config.volume, maxVolume);
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 0.2);

    switch (config.channel) {
      case "left":
        this.panNode.pan.value = -1;
        break;
      case "right":
        this.panNode.pan.value = 1;
        break;
      case "stereo":
        this.panNode.pan.value = 0;
        break;
    }

    if (config.waveform === "white" || config.waveform === "pink") {
      this.isNoiseMode = true;
      const buffer = this.createNoiseBuffer(config.waveform);
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.gainNode);
    } else {
      this.isNoiseMode = false;
      this.oscillator = ctx.createOscillator();
      this.oscillator.type = config.waveform;
      this.oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      this.oscillator.connect(this.gainNode);
    }

    this.gainNode.connect(this.panNode);
    this.panNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    if (this.isNoiseMode && this.noiseSource) {
      this.noiseSource.start();
    } else if (this.oscillator) {
      this.oscillator.start();
    }
  }

  startSweep(config: ToneConfig, sweepConfig: SweepConfig, maxVolume: number = 1.0): void {
    this.startTone(config, maxVolume);

    if (!this.audioContext || !this.oscillator || this.isNoiseMode) return;

    const { startFreq, endFreq, duration, curve } = sweepConfig;
    const steps = 100;
    const stepDuration = (duration * 1000) / steps;
    let currentStep = 0;

    this.sweepInterval = window.setInterval(() => {
      if (!this.oscillator || !this.audioContext) {
        this.stopSweep();
        return;
      }

      currentStep++;
      const progress = currentStep / steps;

      let frequency: number;
      if (curve === "logarithmic") {
        const logStart = Math.log(startFreq);
        const logEnd = Math.log(endFreq);
        frequency = Math.exp(logStart + (logEnd - logStart) * progress);
      } else {
        frequency = startFreq + (endFreq - startFreq) * progress;
      }

      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      if (currentStep >= steps) {
        this.stopSweep();
      }
    }, stepDuration);
  }

  stopSweep(): void {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
  }

  startBurst(config: ToneConfig, onDuration: number, offDuration: number, maxVolume: number = 1.0): void {
    this.stopBurst();

    let isOn = false;

    const toggle = () => {
      if (isOn) {
        this.cleanupAudioNodes();
        isOn = false;
        this.burstInterval = window.setTimeout(toggle, offDuration);
      } else {
        this.startTone(config, maxVolume);
        isOn = true;
        this.burstInterval = window.setTimeout(toggle, onDuration);
      }
    };

    toggle();
  }

  stopBurst(): void {
    if (this.burstInterval) {
      clearTimeout(this.burstInterval);
      this.burstInterval = null;
    }
  }

  setFrequency(frequency: number): void {
    if (this.oscillator && this.audioContext && !this.isNoiseMode) {
      this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    }
  }

  setVolume(volume: number, maxVolume: number = 1.0): void {
    if (this.gainNode && this.audioContext) {
      const targetVolume = Math.min(volume, maxVolume);
      this.gainNode.gain.setValueAtTime(targetVolume, this.audioContext.currentTime);
    }
  }

  getAnalyserData(): Uint8Array | null {
    if (!this.analyser) return null;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  getCurrentFrequency(): number {
    if (this.oscillator && !this.isNoiseMode) {
      return this.oscillator.frequency.value;
    }
    return 0;
  }

  private cleanupAudioNodes(): void {
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    }

    setTimeout(() => {
      if (this.oscillator) {
        try {
          this.oscillator.stop();
          this.oscillator.disconnect();
        } catch (e) {
          // Already stopped
        }
        this.oscillator = null;
      }

      if (this.noiseSource) {
        try {
          this.noiseSource.stop();
          this.noiseSource.disconnect();
        } catch (e) {
          // Already stopped
        }
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
    }, 150);
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
