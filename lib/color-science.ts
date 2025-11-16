export interface CIExy {
  x: number;
  y: number;
}

export interface CIEXYZ {
  X: number;
  Y: number;
  Z: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface ColorResult {
  hex: string;
  rgb: RGB;
  cieXY: CIExy;
  cct?: number;
  duv?: number;
  inGamut: boolean;
}

export const cctToXY = (cct: number): CIExy => {
  const T = cct;
  const T2 = T * T;
  const T3 = T2 * T;

  let x: number;
  if (T >= 4000 && T <= 7000) {
    x = -4.6070e9 / T3 + 2.9678e6 / T2 + 0.09911e3 / T + 0.244063;
  } else if (T > 7000 && T <= 25000) {
    x = -2.0064e9 / T3 + 1.9018e6 / T2 + 0.24748e3 / T + 0.23704;
  } else {
    x = 0.3366;
  }

  const x2 = x * x;
  const x3 = x2 * x;

  let y: number;
  if (T >= 2222 && T <= 4000) {
    y = -1.1063814 * x3 - 1.34811020 * x2 + 2.18555832 * x - 0.20219683;
  } else if (T > 4000 && T <= 25000) {
    y = -0.9549476 * x3 - 1.37418593 * x2 + 2.09137015 * x - 0.16748867;
  } else {
    y = 0.3902;
  }

  return { x, y };
};

export const xyToXYZ = (x: number, y: number, Y: number = 1): CIEXYZ => {
  if (y === 0) {
    return { X: 0, Y: 0, Z: 0 };
  }
  const X = (Y / y) * x;
  const Z = (Y / y) * (1 - x - y);
  return { X, Y, Z };
};

export const XYZToRGB = (xyz: CIEXYZ): RGB => {
  const X = xyz.X / 100;
  const Y = xyz.Y / 100;
  const Z = xyz.Z / 100;

  let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let b = X * 0.0557 + Y * -0.204 + Z * 1.057;

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    r: Math.round(Math.max(0, Math.min(1, r)) * 255),
    g: Math.round(Math.max(0, Math.min(1, g)) * 255),
    b: Math.round(Math.max(0, Math.min(1, b)) * 255),
  };
};

export const rgbToXYZ = (rgb: RGB): CIEXYZ => {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  const Y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  return { X, Y, Z };
};

export const XYZToXY = (xyz: CIEXYZ): CIExy => {
  const sum = xyz.X + xyz.Y + xyz.Z;
  if (sum === 0) {
    return { x: 0.3127, y: 0.329 };
  }
  return {
    x: xyz.X / sum,
    y: xyz.Y / sum,
  };
};

export const rgbToHex = (rgb: RGB): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const isInGamut = (rgb: RGB): boolean => {
  return rgb.r >= 0 && rgb.r <= 255 && rgb.g >= 0 && rgb.g <= 255 && rgb.b >= 0 && rgb.b <= 255;
};

export const cctToRGB = (cct: number): ColorResult => {
  const xy = cctToXY(cct);
  const xyz = xyToXYZ(xy.x, xy.y, 100);
  const rgb = XYZToRGB(xyz);
  const hex = rgbToHex(rgb);
  const inGamut = isInGamut(rgb);

  return {
    hex,
    rgb,
    cieXY: xy,
    cct,
    inGamut,
  };
};

export const xyToRGB = (x: number, y: number, Y: number = 100): ColorResult => {
  const xyz = xyToXYZ(x, y, Y);
  const rgb = XYZToRGB(xyz);
  const hex = rgbToHex(rgb);
  const inGamut = isInGamut(rgb);

  return {
    hex,
    rgb,
    cieXY: { x, y },
    inGamut,
  };
};

export const hexToXY = (hex: string): CIExy | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const xyz = rgbToXYZ(rgb);
  return XYZToXY(xyz);
};

export const xyToLab = (x: number, y: number, Y: number = 100): { L: number; a: number; b: number } => {
  const xyz = xyToXYZ(x, y, Y);

  const Xn = 95.047;
  const Yn = 100.0;
  const Zn = 108.883;

  let xr = xyz.X / Xn;
  let yr = xyz.Y / Yn;
  let zr = xyz.Z / Zn;

  const f = (t: number) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);

  xr = f(xr);
  yr = f(yr);
  zr = f(zr);

  const L = 116 * yr - 16;
  const a = 500 * (xr - yr);
  const b = 200 * (yr - zr);

  return { L, a, b };
};

export const deltaE = (
  xy1: CIExy,
  xy2: CIExy,
  method: 'CIE76' | 'CIE94' | 'CIE2000' = 'CIE76'
): number => {
  const lab1 = xyToLab(xy1.x, xy1.y);
  const lab2 = xyToLab(xy2.x, xy2.y);

  if (method === 'CIE76') {
    const dL = lab1.L - lab2.L;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  return Math.sqrt(
    Math.pow(lab1.L - lab2.L, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
};

export const estimateCCT = (x: number, y: number): number | null => {
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 449 * Math.pow(n, 3) + 3525 * Math.pow(n, 2) + 6823.3 * n + 5520.33;

  if (cct < 1000 || cct > 25000) {
    return null;
  }

  return Math.round(cct);
};

export const calculateDuv = (x: number, y: number, cct: number): number => {
  const targetXY = cctToXY(cct);
  const du = x - targetXY.x;
  const dv = y - targetXY.y;
  return Math.sqrt(du * du + dv * dv) * Math.sign(dv);
};
