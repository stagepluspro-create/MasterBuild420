import { LUT3D } from './lut-parser';

export interface LUTAdjustments {
  contrast: number;
  gamma: number;
  saturation: number;
  brightness: number;
  temperature: number;
  tint: number;
}

export class LUTGenerator {
  static generateAdjustmentLUT(
    adjustments: LUTAdjustments,
    size: number = 33,
    title: string = 'Custom Adjustment'
  ): LUT3D {
    const data: [number, number, number][][][] = [];

    for (let b = 0; b < size; b++) {
      data[b] = [];
      for (let g = 0; g < size; g++) {
        data[b][g] = [];
        for (let r = 0; r < size; r++) {
          let rNorm = r / (size - 1);
          let gNorm = g / (size - 1);
          let bNorm = b / (size - 1);

          [rNorm, gNorm, bNorm] = this.applyBrightness(rNorm, gNorm, bNorm, adjustments.brightness);
          [rNorm, gNorm, bNorm] = this.applyContrast(rNorm, gNorm, bNorm, adjustments.contrast);
          [rNorm, gNorm, bNorm] = this.applyGamma(rNorm, gNorm, bNorm, adjustments.gamma);
          [rNorm, gNorm, bNorm] = this.applySaturation(rNorm, gNorm, bNorm, adjustments.saturation);
          [rNorm, gNorm, bNorm] = this.applyTemperature(rNorm, gNorm, bNorm, adjustments.temperature);
          [rNorm, gNorm, bNorm] = this.applyTint(rNorm, gNorm, bNorm, adjustments.tint);

          data[b][g][r] = [
            Math.max(0, Math.min(1, rNorm)),
            Math.max(0, Math.min(1, gNorm)),
            Math.max(0, Math.min(1, bNorm))
          ];
        }
      }
    }

    return {
      type: '3D',
      size,
      data,
      title,
      domain: { min: [0, 0, 0], max: [1, 1, 1] }
    };
  }

  private static applyBrightness(
    r: number,
    g: number,
    b: number,
    brightness: number
  ): [number, number, number] {
    const offset = (brightness - 1.0);
    return [r + offset, g + offset, b + offset];
  }

  private static applyContrast(
    r: number,
    g: number,
    b: number,
    contrast: number
  ): [number, number, number] {
    const factor = contrast;
    return [
      (r - 0.5) * factor + 0.5,
      (g - 0.5) * factor + 0.5,
      (b - 0.5) * factor + 0.5
    ];
  }

  private static applyGamma(
    r: number,
    g: number,
    b: number,
    gamma: number
  ): [number, number, number] {
    return [
      Math.pow(r, 1 / gamma),
      Math.pow(g, 1 / gamma),
      Math.pow(b, 1 / gamma)
    ];
  }

  private static applySaturation(
    r: number,
    g: number,
    b: number,
    saturation: number
  ): [number, number, number] {
    const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
    return [
      gray + (r - gray) * saturation,
      gray + (g - gray) * saturation,
      gray + (b - gray) * saturation
    ];
  }

  private static applyTemperature(
    r: number,
    g: number,
    b: number,
    temperature: number
  ): [number, number, number] {
    const shift = (temperature - 1.0) * 0.3;
    return [
      r + shift,
      g,
      b - shift
    ];
  }

  private static applyTint(
    r: number,
    g: number,
    b: number,
    tint: number
  ): [number, number, number] {
    const shift = (tint - 1.0) * 0.3;
    return [
      r,
      g + shift,
      b
    ];
  }

  static getDefaultAdjustments(): LUTAdjustments {
    return {
      contrast: 1.0,
      gamma: 1.0,
      saturation: 1.0,
      brightness: 1.0,
      temperature: 1.0,
      tint: 1.0
    };
  }
}
