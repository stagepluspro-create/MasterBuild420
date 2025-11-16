import { RGB, CIEXYZ, rgbToXYZ, XYZToRGB } from "@/lib/color-science";

export type ColorSpace = 'sRGB' | 'Rec709' | 'Rec2020' | 'DCIP3' | 'ACEScg';

export interface ColorSpaceMatrix {
  toXYZ: number[][];
  fromXYZ: number[][];
  gamma: number;
  name: string;
}

const sRGBMatrix: ColorSpaceMatrix = {
  name: 'sRGB',
  gamma: 2.4,
  toXYZ: [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.0721750],
    [0.0193339, 0.1191920, 0.9503041]
  ],
  fromXYZ: [
    [3.2404542, -1.5371385, -0.4985314],
    [-0.9692660, 1.8760108, 0.0415560],
    [0.0556434, -0.2040259, 1.0572252]
  ]
};

const rec709Matrix: ColorSpaceMatrix = {
  name: 'Rec.709',
  gamma: 2.4,
  toXYZ: [
    [0.4124, 0.3576, 0.1805],
    [0.2126, 0.7152, 0.0722],
    [0.0193, 0.1192, 0.9505]
  ],
  fromXYZ: [
    [3.2410, -1.5374, -0.4986],
    [-0.9692, 1.8760, 0.0416],
    [0.0556, -0.2040, 1.0570]
  ]
};

const rec2020Matrix: ColorSpaceMatrix = {
  name: 'Rec.2020',
  gamma: 2.4,
  toXYZ: [
    [0.6370, 0.1446, 0.1689],
    [0.2627, 0.6780, 0.0593],
    [0.0000, 0.0281, 1.0610]
  ],
  fromXYZ: [
    [1.7167, -0.3557, -0.2534],
    [-0.6667, 1.6165, 0.0158],
    [0.0176, -0.0428, 0.9421]
  ]
};

const dciP3Matrix: ColorSpaceMatrix = {
  name: 'DCI-P3',
  gamma: 2.6,
  toXYZ: [
    [0.4865709, 0.2656677, 0.1982173],
    [0.2289746, 0.6917385, 0.0792869],
    [0.0000000, 0.0451134, 1.0439444]
  ],
  fromXYZ: [
    [2.4934969, -0.9313836, -0.4027108],
    [-0.8294890, 1.7626641, 0.0236247],
    [0.0358458, -0.0761724, 0.9568845]
  ]
};

const acesCgMatrix: ColorSpaceMatrix = {
  name: 'ACEScg',
  gamma: 1.0,
  toXYZ: [
    [0.6624542, 0.1340042, 0.1561877],
    [0.2722287, 0.6740818, 0.0536895],
    [-0.0055746, 0.0040607, 1.0103391]
  ],
  fromXYZ: [
    [1.6410234, -0.3248033, -0.2364247],
    [-0.6636629, 1.6153316, 0.0167563],
    [0.0117219, -0.0082845, 0.9883948]
  ]
};

export const colorSpaceMatrices: Record<ColorSpace, ColorSpaceMatrix> = {
  sRGB: sRGBMatrix,
  Rec709: rec709Matrix,
  Rec2020: rec2020Matrix,
  DCIP3: dciP3Matrix,
  ACEScg: acesCgMatrix
};

function matrixMultiply3x3(matrix: number[][], vec: number[]): number[] {
  return [
    matrix[0][0] * vec[0] + matrix[0][1] * vec[1] + matrix[0][2] * vec[2],
    matrix[1][0] * vec[0] + matrix[1][1] * vec[1] + matrix[1][2] * vec[2],
    matrix[2][0] * vec[0] + matrix[2][1] * vec[1] + matrix[2][2] * vec[2]
  ];
}

function linearToGamma(linear: number, gamma: number): number {
  if (gamma === 1.0) return linear;
  if (gamma === 2.4) {
    return linear <= 0.0031308
      ? 12.92 * linear
      : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  }
  return Math.pow(Math.max(0, linear), 1 / gamma);
}

function gammaToLinear(gamma: number, gammaValue: number): number {
  if (gammaValue === 1.0) return gamma;
  if (gammaValue === 2.4) {
    return gamma <= 0.04045
      ? gamma / 12.92
      : Math.pow((gamma + 0.055) / 1.055, 2.4);
  }
  return Math.pow(Math.max(0, gamma), gammaValue);
}

export function convertColorSpace(
  rgb: RGB,
  sourceSpace: ColorSpace,
  targetSpace: ColorSpace
): RGB {
  if (sourceSpace === targetSpace) {
    return rgb;
  }

  const sourceMatrix = colorSpaceMatrices[sourceSpace];
  const targetMatrix = colorSpaceMatrices[targetSpace];

  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = gammaToLinear(r, sourceMatrix.gamma);
  g = gammaToLinear(g, sourceMatrix.gamma);
  b = gammaToLinear(b, sourceMatrix.gamma);

  const xyz = matrixMultiply3x3(sourceMatrix.toXYZ, [r, g, b]);

  let linear = matrixMultiply3x3(targetMatrix.fromXYZ, xyz);

  const outR = linearToGamma(linear[0], targetMatrix.gamma);
  const outG = linearToGamma(linear[1], targetMatrix.gamma);
  const outB = linearToGamma(linear[2], targetMatrix.gamma);

  return {
    r: Math.round(Math.max(0, Math.min(1, outR)) * 255),
    g: Math.round(Math.max(0, Math.min(1, outG)) * 255),
    b: Math.round(Math.max(0, Math.min(1, outB)) * 255)
  };
}

export function isInGamut(rgb: RGB, colorSpace: ColorSpace): boolean {
  const matrix = colorSpaceMatrices[colorSpace];

  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = gammaToLinear(r, matrix.gamma);
  g = gammaToLinear(g, matrix.gamma);
  b = gammaToLinear(b, matrix.gamma);

  return r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1;
}

export function gamutClip(rgb: RGB): RGB {
  return {
    r: Math.max(0, Math.min(255, rgb.r)),
    g: Math.max(0, Math.min(255, rgb.g)),
    b: Math.max(0, Math.min(255, rgb.b))
  };
}

export function getColorSpaceInfo(colorSpace: ColorSpace): ColorSpaceMatrix {
  return colorSpaceMatrices[colorSpace];
}
