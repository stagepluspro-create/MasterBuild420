import { LUT, LUT3D, LUT1D } from './lut-parser';

export class LUTEngine {
  static applyLUTToImageData(
    imageData: ImageData,
    lut: LUT,
    outputImageData?: ImageData
  ): ImageData {
    const output = outputImageData || new ImageData(imageData.width, imageData.height);
    const data = imageData.data;
    const outData = output.data;

    if (lut.type === '3D') {
      this.apply3DLUT(data, outData, lut);
    } else {
      this.apply1DLUT(data, outData, lut);
    }

    return output;
  }

  private static apply3DLUT(
    inData: Uint8ClampedArray,
    outData: Uint8ClampedArray,
    lut: LUT3D
  ): void {
    const size = lut.size;
    const maxIndex = size - 1;

    for (let i = 0; i < inData.length; i += 4) {
      let r = inData[i] / 255;
      let g = inData[i + 1] / 255;
      let b = inData[i + 2] / 255;

      if (lut.domain) {
        r = (r - lut.domain.min[0]) / (lut.domain.max[0] - lut.domain.min[0]);
        g = (g - lut.domain.min[1]) / (lut.domain.max[1] - lut.domain.min[1]);
        b = (b - lut.domain.min[2]) / (lut.domain.max[2] - lut.domain.min[2]);
      }

      r = Math.max(0, Math.min(1, r));
      g = Math.max(0, Math.min(1, g));
      b = Math.max(0, Math.min(1, b));

      const rScaled = r * maxIndex;
      const gScaled = g * maxIndex;
      const bScaled = b * maxIndex;

      const r0 = Math.floor(rScaled);
      const g0 = Math.floor(gScaled);
      const b0 = Math.floor(bScaled);

      const r1 = Math.min(r0 + 1, maxIndex);
      const g1 = Math.min(g0 + 1, maxIndex);
      const b1 = Math.min(b0 + 1, maxIndex);

      const rFrac = rScaled - r0;
      const gFrac = gScaled - g0;
      const bFrac = bScaled - b0;

      const c000 = lut.data[b0][g0][r0];
      const c001 = lut.data[b0][g0][r1];
      const c010 = lut.data[b0][g1][r0];
      const c011 = lut.data[b0][g1][r1];
      const c100 = lut.data[b1][g0][r0];
      const c101 = lut.data[b1][g0][r1];
      const c110 = lut.data[b1][g1][r0];
      const c111 = lut.data[b1][g1][r1];

      const c00_r = c000[0] * (1 - rFrac) + c001[0] * rFrac;
      const c01_r = c010[0] * (1 - rFrac) + c011[0] * rFrac;
      const c10_r = c100[0] * (1 - rFrac) + c101[0] * rFrac;
      const c11_r = c110[0] * (1 - rFrac) + c111[0] * rFrac;
      const c0_r = c00_r * (1 - gFrac) + c01_r * gFrac;
      const c1_r = c10_r * (1 - gFrac) + c11_r * gFrac;
      const outR = c0_r * (1 - bFrac) + c1_r * bFrac;

      const c00_g = c000[1] * (1 - rFrac) + c001[1] * rFrac;
      const c01_g = c010[1] * (1 - rFrac) + c011[1] * rFrac;
      const c10_g = c100[1] * (1 - rFrac) + c101[1] * rFrac;
      const c11_g = c110[1] * (1 - rFrac) + c111[1] * rFrac;
      const c0_g = c00_g * (1 - gFrac) + c01_g * gFrac;
      const c1_g = c10_g * (1 - gFrac) + c11_g * gFrac;
      const outG = c0_g * (1 - bFrac) + c1_g * bFrac;

      const c00_b = c000[2] * (1 - rFrac) + c001[2] * rFrac;
      const c01_b = c010[2] * (1 - rFrac) + c011[2] * rFrac;
      const c10_b = c100[2] * (1 - rFrac) + c101[2] * rFrac;
      const c11_b = c110[2] * (1 - rFrac) + c111[2] * rFrac;
      const c0_b = c00_b * (1 - gFrac) + c01_b * gFrac;
      const c1_b = c10_b * (1 - gFrac) + c11_b * gFrac;
      const outB = c0_b * (1 - bFrac) + c1_b * bFrac;

      outData[i] = Math.round(Math.max(0, Math.min(1, outR)) * 255);
      outData[i + 1] = Math.round(Math.max(0, Math.min(1, outG)) * 255);
      outData[i + 2] = Math.round(Math.max(0, Math.min(1, outB)) * 255);
      outData[i + 3] = inData[i + 3];
    }
  }

  private static apply1DLUT(
    inData: Uint8ClampedArray,
    outData: Uint8ClampedArray,
    lut: LUT1D
  ): void {
    const size = lut.size;
    const maxIndex = size - 1;

    for (let i = 0; i < inData.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const input = inData[i + ch] / 255;
        const scaled = input * maxIndex;
        const idx0 = Math.floor(scaled);
        const idx1 = Math.min(idx0 + 1, maxIndex);
        const frac = scaled - idx0;

        const val0 = lut.data[idx0][ch];
        const val1 = lut.data[idx1][ch];
        const output = val0 * (1 - frac) + val1 * frac;

        outData[i + ch] = Math.round(Math.max(0, Math.min(1, output)) * 255);
      }
      outData[i + 3] = inData[i + 3];
    }
  }

  static createIdentityLUT(size: number = 33): LUT3D {
    const data: [number, number, number][][][] = [];

    for (let b = 0; b < size; b++) {
      data[b] = [];
      for (let g = 0; g < size; g++) {
        data[b][g] = [];
        for (let r = 0; r < size; r++) {
          data[b][g][r] = [
            r / (size - 1),
            g / (size - 1),
            b / (size - 1)
          ];
        }
      }
    }

    return {
      type: '3D',
      size,
      data,
      title: 'Identity LUT',
      domain: { min: [0, 0, 0], max: [1, 1, 1] }
    };
  }
}
