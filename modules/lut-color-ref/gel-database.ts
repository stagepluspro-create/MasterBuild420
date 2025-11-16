export interface GelFilter {
  id: string;
  manufacturer: 'Roscolux' | 'Lee' | 'Apollo';
  number: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  transmission: number;
  cct?: number;
  category: 'correction' | 'color' | 'diffusion' | 'neutral';
}

export const gelDatabase: GelFilter[] = [
  { id: 'r02', manufacturer: 'Roscolux', number: '02', name: 'Bastard Amber', hex: '#ffb975', rgb: { r: 255, g: 185, b: 117 }, transmission: 55, cct: 3200, category: 'correction' },
  { id: 'r03', manufacturer: 'Roscolux', number: '03', name: 'Dark Bastard Amber', hex: '#ff9d52', rgb: { r: 255, g: 157, b: 82 }, transmission: 39, cct: 2900, category: 'correction' },
  { id: 'r09', manufacturer: 'Roscolux', number: '09', name: 'Pale Amber Gold', hex: '#ffd699', rgb: { r: 255, g: 214, b: 153 }, transmission: 72, cct: 3800, category: 'correction' },
  { id: 'r19', manufacturer: 'Roscolux', number: '19', name: 'Fire', hex: '#ff4500', rgb: { r: 255, g: 69, b: 0 }, transmission: 15, category: 'color' },
  { id: 'r26', manufacturer: 'Roscolux', number: '26', name: 'Light Red', hex: '#ff6b6b', rgb: { r: 255, g: 107, b: 107 }, transmission: 25, category: 'color' },
  { id: 'r33', manufacturer: 'Roscolux', number: '33', name: 'No Color Straw', hex: '#ffe8b3', rgb: { r: 255, g: 232, b: 179 }, transmission: 84, cct: 4200, category: 'correction' },
  { id: 'r60', manufacturer: 'Roscolux', number: '60', name: 'No Color Blue', hex: '#e6f2ff', rgb: { r: 230, g: 242, b: 255 }, transmission: 87, cct: 6500, category: 'correction' },
  { id: 'r64', manufacturer: 'Roscolux', number: '64', name: 'Light Steel Blue', hex: '#b3d9ff', rgb: { r: 179, g: 217, b: 255 }, transmission: 65, cct: 7000, category: 'color' },
  { id: 'r80', manufacturer: 'Roscolux', number: '80', name: 'Primary Blue', hex: '#0047ab', rgb: { r: 0, g: 71, b: 171 }, transmission: 8, category: 'color' },
  { id: 'r90', manufacturer: 'Roscolux', number: '90', name: 'Dark Yellow Green', hex: '#7cb342', rgb: { r: 124, g: 179, b: 66 }, transmission: 22, category: 'color' },

  { id: 'l101', manufacturer: 'Lee', number: '101', name: 'Yellow', hex: '#ffeb3b', rgb: { r: 255, g: 235, b: 59 }, transmission: 75, category: 'color' },
  { id: 'l106', manufacturer: 'Lee', number: '106', name: 'Primary Red', hex: '#d32f2f', rgb: { r: 211, g: 47, b: 47 }, transmission: 12, category: 'color' },
  { id: 'l119', manufacturer: 'Lee', number: '119', name: 'Dark Blue', hex: '#1565c0', rgb: { r: 21, g: 101, b: 192 }, transmission: 10, category: 'color' },
  { id: 'l139', manufacturer: 'Lee', number: '139', name: 'Primary Green', hex: '#4caf50', rgb: { r: 76, g: 175, b: 80 }, transmission: 18, category: 'color' },
  { id: 'l147', manufacturer: 'Lee', number: '147', name: 'Apricot', hex: '#ffab91', rgb: { r: 255, g: 171, b: 145 }, transmission: 48, cct: 3400, category: 'correction' },
  { id: 'l152', manufacturer: 'Lee', number: '152', name: 'Pale Gold', hex: '#ffe082', rgb: { r: 255, g: 224, b: 130 }, transmission: 68, cct: 3600, category: 'correction' },
  { id: 'l161', manufacturer: 'Lee', number: '161', name: 'Slate Blue', hex: '#7986cb', rgb: { r: 121, g: 134, b: 203 }, transmission: 35, category: 'color' },
  { id: 'l180', manufacturer: 'Lee', number: '180', name: 'Dark Lavender', hex: '#9575cd', rgb: { r: 149, g: 117, b: 205 }, transmission: 28, category: 'color' },
  { id: 'l201', manufacturer: 'Lee', number: '201', name: 'Full CT Blue', hex: '#b3d9ff', rgb: { r: 179, g: 217, b: 255 }, transmission: 55, cct: 5500, category: 'correction' },
  { id: 'l204', manufacturer: 'Lee', number: '204', name: 'Full CT Orange', hex: '#ffb366', rgb: { r: 255, g: 179, b: 102 }, transmission: 42, cct: 3200, category: 'correction' },

  { id: 'a3150', manufacturer: 'Apollo', number: '3150', name: 'Urban Blue', hex: '#4fc3f7', rgb: { r: 79, g: 195, b: 247 }, transmission: 32, category: 'color' },
  { id: 'a3202', manufacturer: 'Apollo', number: '3202', name: 'Half Blue', hex: '#b3e5fc', rgb: { r: 179, g: 229, b: 252 }, transmission: 62, cct: 5000, category: 'correction' },
  { id: 'a3220', manufacturer: 'Apollo', number: '3220', name: 'Double Blue', hex: '#64b5f6', rgb: { r: 100, g: 181, b: 246 }, transmission: 38, cct: 6500, category: 'correction' },
  { id: 'a3304', manufacturer: 'Apollo', number: '3304', name: 'Pale Amber', hex: '#ffd699', rgb: { r: 255, g: 214, b: 153 }, transmission: 70, cct: 3800, category: 'correction' },
  { id: 'a3308', manufacturer: 'Apollo', number: '3308', name: 'Pale Gold', hex: '#ffe599', rgb: { r: 255, g: 229, b: 153 }, transmission: 75, cct: 4000, category: 'correction' },
  { id: 'a3411', manufacturer: 'Apollo', number: '3411', name: 'Medium Red', hex: '#ff5252', rgb: { r: 255, g: 82, b: 82 }, transmission: 20, category: 'color' },
  { id: 'a3421', manufacturer: 'Apollo', number: '3421', name: 'Bright Red', hex: '#ff1744', rgb: { r: 255, g: 23, b: 68 }, transmission: 10, category: 'color' },
  { id: 'a3707', manufacturer: 'Apollo', number: '3707', name: 'Light Green', hex: '#aed581', rgb: { r: 174, g: 213, b: 129 }, transmission: 45, category: 'color' },
  { id: 'a3722', manufacturer: 'Apollo', number: '3722', name: 'Kelly Green', hex: '#66bb6a', rgb: { r: 102, g: 187, b: 106 }, transmission: 28, category: 'color' },
  { id: 'a3810', manufacturer: 'Apollo', number: '3810', name: 'Light Lavender', hex: '#ce93d8', rgb: { r: 206, g: 147, b: 216 }, transmission: 40, category: 'color' }
];

export function searchGels(query: string): GelFilter[] {
  const lowerQuery = query.toLowerCase();
  return gelDatabase.filter(gel =>
    gel.number.includes(query) ||
    gel.name.toLowerCase().includes(lowerQuery) ||
    gel.manufacturer.toLowerCase().includes(lowerQuery)
  );
}

export function getGelsByManufacturer(manufacturer: 'Roscolux' | 'Lee' | 'Apollo'): GelFilter[] {
  return gelDatabase.filter(gel => gel.manufacturer === manufacturer);
}

export function getGelsByCategory(category: GelFilter['category']): GelFilter[] {
  return gelDatabase.filter(gel => gel.category === category);
}

export function findClosestGel(targetRgb: { r: number; g: number; b: number }): GelFilter {
  let closestGel = gelDatabase[0];
  let minDistance = Infinity;

  for (const gel of gelDatabase) {
    const distance = Math.sqrt(
      Math.pow(gel.rgb.r - targetRgb.r, 2) +
      Math.pow(gel.rgb.g - targetRgb.g, 2) +
      Math.pow(gel.rgb.b - targetRgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestGel = gel;
    }
  }

  return closestGel;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}
