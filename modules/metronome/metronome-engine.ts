export type ClickSoundType = "woodblock" | "beep" | "digital" | "rimshot";
export type SubdivisionType = "quarter" | "eighth" | "triplet" | "sixteenth";

export interface MetronomeConfig {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: SubdivisionType;
  soundType: ClickSoundType;
  accentVolume: number;
  beatVolume: number;
  muted: boolean;
}

export class MetronomeEngine {
  private audioContext: AudioContext | null = null;
  private nextNoteTime: number = 0;
  private currentBeat: number = 0;
  private currentSubdivision: number = 0;
  private timerID: number | null = null;
  private isRunning: boolean = false;
  private scheduleAheadTime: number = 0.1;
  private lookAhead: number = 25.0;
  private config: MetronomeConfig;
  private onBeatCallback: ((beat: number, subdivision: number) => void) | null = null;

  constructor() {
    this.config = {
      bpm: 120,
      beatsPerMeasure: 4,
      subdivision: "quarter",
      soundType: "woodblock",
      accentVolume: 0.8,
      beatVolume: 0.5,
      muted: false,
    };
  }

  initialize(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  updateConfig(config: Partial<MetronomeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setOnBeatCallback(callback: (beat: number, subdivision: number) => void): void {
    this.onBeatCallback = callback;
  }

  private getSubdivisionsPerBeat(): number {
    switch (this.config.subdivision) {
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
  }

  private getSecondsBetweenClicks(): number {
    const beatsPerSecond = this.config.bpm / 60.0;
    const subdivisionsPerBeat = this.getSubdivisionsPerBeat();
    return 1.0 / (beatsPerSecond * subdivisionsPerBeat);
  }

  private scheduleNote(time: number, isAccent: boolean): void {
    if (!this.audioContext || this.config.muted) return;

    const volume = isAccent ? this.config.accentVolume : this.config.beatVolume;

    switch (this.config.soundType) {
      case "woodblock":
        this.playWoodblock(time, volume, isAccent);
        break;
      case "beep":
        this.playBeep(time, volume, isAccent);
        break;
      case "digital":
        this.playDigital(time, volume, isAccent);
        break;
      case "rimshot":
        this.playRimshot(time, volume, isAccent);
        break;
    }

    if (this.onBeatCallback) {
      const delay = (time - this.audioContext.currentTime) * 1000;
      setTimeout(() => {
        if (this.onBeatCallback) {
          this.onBeatCallback(this.currentBeat, this.currentSubdivision);
        }
      }, delay);
    }
  }

  private playWoodblock(time: number, volume: number, isAccent: boolean): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(isAccent ? 800 : 1200, time);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(800, time);
    filter.Q.setValueAtTime(0.5, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playBeep(time: number, volume: number, isAccent: boolean): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isAccent ? 880 : 440, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  private playDigital(time: number, volume: number, isAccent: boolean): void {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(isAccent ? 1760 : 880, time);

    gain.gain.setValueAtTime(volume * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  private playRimshot(time: number, volume: number, isAccent: boolean): void {
    if (!this.audioContext) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(200, time);

    osc2.type = "square";
    osc2.frequency.setValueAtTime(isAccent ? 3000 : 2000, time);

    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(2000, time);

    noiseGain.gain.setValueAtTime(volume * 0.3, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    gain.gain.setValueAtTime(volume * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc1.connect(gain);
    osc2.connect(gain);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    gain.connect(this.audioContext.destination);
    noiseGain.connect(this.audioContext.destination);

    osc1.start(time);
    osc1.stop(time + 0.05);
    osc2.start(time);
    osc2.stop(time + 0.03);
    noiseSource.start(time);
  }

  private nextNote(): void {
    const secondsPerClick = this.getSecondsBetweenClicks();
    this.nextNoteTime += secondsPerClick;

    const subdivisionsPerBeat = this.getSubdivisionsPerBeat();
    this.currentSubdivision++;

    if (this.currentSubdivision >= subdivisionsPerBeat) {
      this.currentSubdivision = 0;
      this.currentBeat++;
      if (this.currentBeat >= this.config.beatsPerMeasure) {
        this.currentBeat = 0;
      }
    }
  }

  private scheduler(): void {
    if (!this.audioContext) return;

    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      const isAccent = this.currentSubdivision === 0 && this.currentBeat === 0;
      this.scheduleNote(this.nextNoteTime, isAccent);
      this.nextNote();
    }
  }

  start(): void {
    if (this.isRunning) return;

    const ctx = this.initialize();
    this.isRunning = true;
    this.currentBeat = 0;
    this.currentSubdivision = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;

    const schedulerFunc = () => {
      this.scheduler();
      if (this.isRunning) {
        this.timerID = window.setTimeout(schedulerFunc, this.lookAhead);
      }
    };
    schedulerFunc();
  }

  stop(): void {
    this.isRunning = false;
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }
  }

  cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getCurrentBeat(): number {
    return this.currentBeat;
  }

  getCurrentSubdivision(): number {
    return this.currentSubdivision;
  }
}
