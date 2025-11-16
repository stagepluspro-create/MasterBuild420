export interface TunerResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  inTune: boolean;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class TunerEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private referenceFrequency: number = 440;
  private smoothingFactor: number = 0.8;
  private minFrequency: number = 50;
  private maxFrequency: number = 2000;

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 8192;
      this.analyser.smoothingTimeConstant = this.smoothingFactor;

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);
    } catch (error) {
      throw new Error("Microphone access denied or unavailable");
    }
  }

  setReferenceFrequency(freq: number): void {
    this.referenceFrequency = freq;
  }

  getReferenceFrequency(): number {
    return this.referenceFrequency;
  }

  getTimeDomainData(): Uint8Array | null {
    if (!this.analyser) return null;
    const buffer = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }

  getSignalStrength(): number {
    const buffer = this.getTimeDomainData();
    if (!buffer) return 0;

    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      const normalized = (buffer[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / buffer.length);
    return Math.min(rms * 100, 100);
  }

  private autoCorrelate(buffer: Uint8Array, sampleRate: number): number {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let best_offset = -1;
    let best_correlation = 0;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
      const val = (buffer[i] - 128) / 128;
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) return -1;

    let lastCorrelation = 1;
    for (let offset = this.minFrequency; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        const val1 = (buffer[i] - 128) / 128;
        const val2 = (buffer[i + offset] - 128) / 128;
        correlation += val1 * val2;
      }

      correlation = correlation / MAX_SAMPLES;

      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation =
          correlation > best_correlation && offset > this.minFrequency;

        if (foundGoodCorrelation) {
          best_correlation = correlation;
          best_offset = offset;
        }
      }

      lastCorrelation = correlation;
    }

    if (best_correlation > 0.01) {
      const freq = sampleRate / best_offset;
      if (freq >= this.minFrequency && freq <= this.maxFrequency) {
        return freq;
      }
    }

    return -1;
  }

  detectPitch(): TunerResult | null {
    if (!this.analyser || !this.audioContext) return null;

    const buffer = this.getTimeDomainData();
    if (!buffer) return null;

    const frequency = this.autoCorrelate(buffer, this.audioContext.sampleRate);

    if (frequency === -1) {
      return null;
    }

    const noteInfo = this.frequencyToNote(frequency);
    const cents = this.getCents(frequency, noteInfo.targetFrequency);
    const inTune = Math.abs(cents) < 5;

    return {
      frequency,
      note: noteInfo.note,
      octave: noteInfo.octave,
      cents,
      inTune,
    };
  }

  private frequencyToNote(frequency: number): {
    note: string;
    octave: number;
    targetFrequency: number;
  } {
    const A4 = this.referenceFrequency;
    const C0 = A4 * Math.pow(2, -4.75);

    const halfSteps = 12 * Math.log2(frequency / C0);
    const noteIndex = Math.round(halfSteps) % 12;
    const octave = Math.floor(Math.round(halfSteps) / 12);

    const note = NOTE_NAMES[noteIndex];
    const targetFrequency = C0 * Math.pow(2, Math.round(halfSteps) / 12);

    return { note, octave, targetFrequency };
  }

  private getCents(frequency: number, targetFrequency: number): number {
    return Math.floor((1200 * Math.log2(frequency / targetFrequency)) * 10) / 10;
  }

  frequencyForNote(note: string, octave: number): number {
    const A4 = this.referenceFrequency;
    const C0 = A4 * Math.pow(2, -4.75);

    const noteIndex = NOTE_NAMES.indexOf(note);
    if (noteIndex === -1) return 0;

    const halfSteps = octave * 12 + noteIndex;
    return C0 * Math.pow(2, halfSteps / 12);
  }

  cleanup(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }
}
