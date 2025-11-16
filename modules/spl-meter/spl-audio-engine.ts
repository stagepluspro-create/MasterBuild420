export type WeightingType = "A" | "C" | "Z";
export type ResponseMode = "fast" | "slow" | "impulse";

export interface SPLMeasurement {
  timestamp: number;
  dbInstant: number;
  dbSlow: number;
  dbPeak: number;
  dbA: number;
  dbC: number;
  dbZ: number;
  leq: number;
  frequencyBands?: number[];
}

export interface SPLConfig {
  weighting: WeightingType;
  responseMode: ResponseMode;
  calibrationOffset: number;
  referenceLevel: number;
}

export class SPLAudioEngine {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  private config: SPLConfig = {
    weighting: "A",
    responseMode: "fast",
    calibrationOffset: 0,
    referenceLevel: 0.00002,
  };

  private isRunning = false;
  private measurementCallback: ((measurement: SPLMeasurement) => void) | null = null;

  private instantBuffer: number[] = [];
  private slowBuffer: number[] = [];
  private peakLevel = -Infinity;
  private leqSum = 0;
  private leqCount = 0;
  private leqStartTime = 0;

  private readonly FAST_TIME_CONSTANT = 0.125;
  private readonly SLOW_TIME_CONSTANT = 1.0;
  private readonly IMPULSE_TIME_CONSTANT = 0.035;

  private readonly FFT_SIZE = 8192;
  private readonly SAMPLE_RATE = 48000;

  async start(config?: Partial<SPLConfig>): Promise<void> {
    if (this.isRunning) return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.SAMPLE_RATE,
        },
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = 0;

      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (event) => {
        this.processAudioBuffer(event.inputBuffer);
      };

      this.isRunning = true;
      this.resetStatistics();
    } catch (error) {
      console.error("Failed to start SPL meter:", error);
      throw error;
    }
  }

  stop(): void {
    if (!this.isRunning) return;

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

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

    this.isRunning = false;
  }

  private processAudioBuffer(buffer: AudioBuffer): void {
    const channelData = buffer.getChannelData(0);
    const rms = this.calculateRMS(channelData);

    const dbInstant = this.rmsToDb(rms);
    const weighted = this.applyWeighting(dbInstant, this.config.weighting);
    const calibrated = weighted + this.config.calibrationOffset;

    this.instantBuffer.push(calibrated);
    if (this.instantBuffer.length > this.getBufferSize("fast")) {
      this.instantBuffer.shift();
    }

    this.slowBuffer.push(calibrated);
    if (this.slowBuffer.length > this.getBufferSize("slow")) {
      this.slowBuffer.shift();
    }

    if (calibrated > this.peakLevel) {
      this.peakLevel = calibrated;
    }

    const linearValue = Math.pow(10, calibrated / 10);
    this.leqSum += linearValue;
    this.leqCount++;

    const dbSlow = this.calculateAverage(this.slowBuffer);
    const leq = this.calculateLeq();

    const dbA = this.applyWeighting(dbInstant, "A") + this.config.calibrationOffset;
    const dbC = this.applyWeighting(dbInstant, "C") + this.config.calibrationOffset;
    const dbZ = dbInstant + this.config.calibrationOffset;

    const frequencyBands = this.analyseFrequencyBands();

    const measurement: SPLMeasurement = {
      timestamp: Date.now(),
      dbInstant: calibrated,
      dbSlow,
      dbPeak: this.peakLevel,
      dbA,
      dbC,
      dbZ,
      leq,
      frequencyBands,
    };

    if (this.measurementCallback) {
      this.measurementCallback(measurement);
    }
  }

  private calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
  }

  private rmsToDb(rms: number): number {
    if (rms === 0) return -Infinity;
    const spl = 20 * Math.log10(rms / this.config.referenceLevel);
    return Math.max(-60, Math.min(140, spl));
  }

  private applyWeighting(dbLevel: number, weighting: WeightingType): number {
    if (weighting === "Z") return dbLevel;

    const frequency = 1000;

    if (weighting === "A") {
      const aWeight = this.aWeightingFilter(frequency);
      return dbLevel + aWeight;
    }

    if (weighting === "C") {
      const cWeight = this.cWeightingFilter(frequency);
      return dbLevel + cWeight;
    }

    return dbLevel;
  }

  private aWeightingFilter(frequency: number): number {
    const f = frequency;
    const f2 = f * f;
    const f4 = f2 * f2;

    const numerator = 12194 * 12194 * f4;
    const denominator =
      (f2 + 20.6 * 20.6) *
      Math.sqrt((f2 + 107.7 * 107.7) * (f2 + 737.9 * 737.9)) *
      (f2 + 12194 * 12194);

    const weight = 20 * Math.log10(numerator / denominator) + 2.0;
    return weight;
  }

  private cWeightingFilter(frequency: number): number {
    const f = frequency;
    const f2 = f * f;

    const numerator = 12194 * 12194 * f2;
    const denominator = (f2 + 20.6 * 20.6) * (f2 + 12194 * 12194);

    const weight = 20 * Math.log10(numerator / denominator) + 0.06;
    return weight;
  }

  private analyseFrequencyBands(): number[] {
    if (!this.analyserNode) return [];

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);

    const octaveBands = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const bandLevels: number[] = [];

    for (const centerFreq of octaveBands) {
      const binStart = Math.floor((centerFreq * 0.707) / (this.SAMPLE_RATE / 2) * bufferLength);
      const binEnd = Math.floor((centerFreq * 1.414) / (this.SAMPLE_RATE / 2) * bufferLength);

      let sum = 0;
      let count = 0;

      for (let i = binStart; i < binEnd && i < bufferLength; i++) {
        sum += dataArray[i];
        count++;
      }

      const avgLevel = count > 0 ? sum / count : 0;
      const dbLevel = (avgLevel / 255) * 100 - 60;
      bandLevels.push(Math.max(-60, dbLevel));
    }

    return bandLevels;
  }

  private calculateAverage(buffer: number[]): number {
    if (buffer.length === 0) return -Infinity;
    const sum = buffer.reduce((acc, val) => acc + val, 0);
    return sum / buffer.length;
  }

  private calculateLeq(): number {
    if (this.leqCount === 0) return -Infinity;
    const avgLinear = this.leqSum / this.leqCount;
    return 10 * Math.log10(avgLinear);
  }

  private getBufferSize(mode: "fast" | "slow"): number {
    const sampleRate = this.SAMPLE_RATE;
    const bufferSize = 4096;
    const updatesPerSecond = sampleRate / bufferSize;

    if (mode === "fast") {
      return Math.floor(this.FAST_TIME_CONSTANT * updatesPerSecond);
    } else {
      return Math.floor(this.SLOW_TIME_CONSTANT * updatesPerSecond);
    }
  }

  setMeasurementCallback(callback: (measurement: SPLMeasurement) => void): void {
    this.measurementCallback = callback;
  }

  updateConfig(config: Partial<SPLConfig>): void {
    this.config = { ...this.config, ...config };
  }

  resetPeak(): void {
    this.peakLevel = -Infinity;
  }

  resetStatistics(): void {
    this.instantBuffer = [];
    this.slowBuffer = [];
    this.peakLevel = -Infinity;
    this.leqSum = 0;
    this.leqCount = 0;
    this.leqStartTime = Date.now();
  }

  getLeqDuration(): number {
    if (this.leqStartTime === 0) return 0;
    return (Date.now() - this.leqStartTime) / 1000;
  }

  cleanup(): void {
    this.stop();
    this.measurementCallback = null;
  }
}
