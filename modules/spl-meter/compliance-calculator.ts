export interface ExposureLimit {
  level: number;
  duration: number;
  standard: string;
}

export interface ComplianceResult {
  currentLevel: number;
  remainingTime: number;
  exposureDose: number;
  isCompliant: boolean;
  warnings: string[];
  recommendations: string[];
}

export interface TWAResult {
  twa: number;
  dose: number;
  projectedDose: number;
  isCompliant: boolean;
  standard: string;
}

export class ComplianceCalculator {
  private exposureHistory: Array<{ level: number; duration: number }> = [];
  private sessionStartTime = 0;

  private readonly OSHA_PEL = 90;
  private readonly OSHA_ACTION_LEVEL = 85;
  private readonly NIOSH_REL = 85;
  private readonly EU_LOWER_EXPOSURE = 80;
  private readonly EU_UPPER_EXPOSURE = 85;
  private readonly EU_PEAK_LIMIT = 137;

  private readonly EXCHANGE_RATE_OSHA = 5;
  private readonly EXCHANGE_RATE_NIOSH = 3;
  private readonly EXCHANGE_RATE_EU = 3;

  startSession(): void {
    this.sessionStartTime = Date.now();
    this.exposureHistory = [];
  }

  addExposure(level: number, durationSeconds: number): void {
    this.exposureHistory.push({ level, duration: durationSeconds });
  }

  calculateOSHATWA(): TWAResult {
    const shiftDuration = 8 * 3600;
    let dose = 0;

    for (const exposure of this.exposureHistory) {
      const allowableTime = this.calculateAllowableTime(
        exposure.level,
        this.OSHA_PEL,
        this.EXCHANGE_RATE_OSHA
      );
      if (allowableTime > 0) {
        dose += (exposure.duration / allowableTime) * 100;
      }
    }

    const twa = this.OSHA_PEL + this.EXCHANGE_RATE_OSHA * Math.log2(dose / 100);
    const elapsedTime = this.getElapsedTime();
    const projectedDose = (dose / elapsedTime) * shiftDuration;

    return {
      twa: Math.max(0, twa),
      dose,
      projectedDose,
      isCompliant: dose < 100,
      standard: "OSHA",
    };
  }

  calculateNIOSHTWA(): TWAResult {
    const shiftDuration = 8 * 3600;
    let dose = 0;

    for (const exposure of this.exposureHistory) {
      const allowableTime = this.calculateAllowableTime(
        exposure.level,
        this.NIOSH_REL,
        this.EXCHANGE_RATE_NIOSH
      );
      if (allowableTime > 0) {
        dose += (exposure.duration / allowableTime) * 100;
      }
    }

    const twa = this.NIOSH_REL + this.EXCHANGE_RATE_NIOSH * Math.log2(dose / 100);
    const elapsedTime = this.getElapsedTime();
    const projectedDose = (dose / elapsedTime) * shiftDuration;

    return {
      twa: Math.max(0, twa),
      dose,
      projectedDose,
      isCompliant: dose < 100,
      standard: "NIOSH",
    };
  }

  calculateEUExposure(): TWAResult {
    const shiftDuration = 8 * 3600;
    let dose = 0;

    for (const exposure of this.exposureHistory) {
      const allowableTime = this.calculateAllowableTime(
        exposure.level,
        this.EU_UPPER_EXPOSURE,
        this.EXCHANGE_RATE_EU
      );
      if (allowableTime > 0) {
        dose += (exposure.duration / allowableTime) * 100;
      }
    }

    const twa = this.EU_UPPER_EXPOSURE + this.EXCHANGE_RATE_EU * Math.log2(dose / 100);
    const elapsedTime = this.getElapsedTime();
    const projectedDose = (dose / elapsedTime) * shiftDuration;

    return {
      twa: Math.max(0, twa),
      dose,
      projectedDose,
      isCompliant: twa < this.EU_UPPER_EXPOSURE,
      standard: "EU Directive 2003/10/EC",
    };
  }

  private calculateAllowableTime(
    level: number,
    referenceLevel: number,
    exchangeRate: number
  ): number {
    if (level < referenceLevel) return Infinity;
    const timeRatio = Math.pow(2, (referenceLevel - level) / exchangeRate);
    return 8 * 3600 * timeRatio;
  }

  getRemainingExposureTime(currentLevel: number, standard: "OSHA" | "NIOSH" | "EU"): number {
    const referenceLevel =
      standard === "OSHA"
        ? this.OSHA_PEL
        : standard === "NIOSH"
        ? this.NIOSH_REL
        : this.EU_UPPER_EXPOSURE;

    const exchangeRate =
      standard === "OSHA"
        ? this.EXCHANGE_RATE_OSHA
        : standard === "NIOSH"
        ? this.EXCHANGE_RATE_NIOSH
        : this.EXCHANGE_RATE_EU;

    const twa =
      standard === "OSHA"
        ? this.calculateOSHATWA()
        : standard === "NIOSH"
        ? this.calculateNIOSHTWA()
        : this.calculateEUExposure();

    const remainingDose = 100 - twa.dose;
    if (remainingDose <= 0) return 0;

    const allowableTime = this.calculateAllowableTime(currentLevel, referenceLevel, exchangeRate);
    const remainingTime = (remainingDose / 100) * allowableTime;

    return Math.max(0, remainingTime);
  }

  getComplianceStatus(currentLevel: number, peakLevel: number): ComplianceResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (currentLevel >= 115) {
      warnings.push("DANGER: Immediate hearing damage risk above 115 dB");
      recommendations.push("Stop work immediately and evacuate the area");
    } else if (currentLevel >= 100) {
      warnings.push("WARNING: Exposure above 100 dB SPL");
      recommendations.push("Use hearing protection and limit exposure time");
    } else if (currentLevel >= this.OSHA_PEL) {
      warnings.push("Approaching OSHA permissible exposure limit");
      recommendations.push("Monitor exposure time and consider hearing protection");
    } else if (currentLevel >= this.OSHA_ACTION_LEVEL) {
      recommendations.push("OSHA action level reached - hearing conservation program recommended");
    }

    if (peakLevel >= this.EU_PEAK_LIMIT) {
      warnings.push(`Peak level ${peakLevel.toFixed(1)} dB exceeds EU limit of 137 dB`);
    }

    const oshaTWA = this.calculateOSHATWA();
    const nioshTWA = this.calculateNIOSHTWA();
    const euTWA = this.calculateEUExposure();

    if (!oshaTWA.isCompliant) {
      warnings.push("OSHA 8-hour TWA dose exceeded");
    }
    if (!nioshTWA.isCompliant) {
      warnings.push("NIOSH recommended exposure limit exceeded");
    }
    if (!euTWA.isCompliant) {
      warnings.push("EU exposure limit exceeded");
    }

    const remainingTime = this.getRemainingExposureTime(currentLevel, "OSHA");

    return {
      currentLevel,
      remainingTime,
      exposureDose: oshaTWA.dose,
      isCompliant: oshaTWA.isCompliant && nioshTWA.isCompliant && euTWA.isCompliant,
      warnings,
      recommendations,
    };
  }

  getMaximumExposureTimes(): ExposureLimit[] {
    return [
      { level: 85, duration: 8 * 3600, standard: "NIOSH REL / EU Lower" },
      { level: 90, duration: 8 * 3600, standard: "OSHA PEL" },
      { level: 95, duration: 4 * 3600, standard: "OSHA" },
      { level: 100, duration: 2 * 3600, standard: "OSHA" },
      { level: 105, duration: 1 * 3600, standard: "OSHA" },
      { level: 110, duration: 0.5 * 3600, standard: "OSHA" },
      { level: 115, duration: 0.25 * 3600, standard: "OSHA" },
    ];
  }

  formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds <= 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  }

  private getElapsedTime(): number {
    if (this.sessionStartTime === 0) return 1;
    return (Date.now() - this.sessionStartTime) / 1000;
  }

  reset(): void {
    this.exposureHistory = [];
    this.sessionStartTime = 0;
  }
}
