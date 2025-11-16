export interface LUT3D {
  size: number;
  data: [number, number, number][][][];
  type: '3D';
  title?: string;
  domain?: { min: number[]; max: number[] };
}

export interface LUT1D {
  size: number;
  data: number[][];
  type: '1D';
  title?: string;
}

export type LUT = LUT3D | LUT1D;

export class LUTParser {
  static async parseCube(fileContent: string): Promise<LUT> {
    const lines = fileContent.split('\n').map(line => line.trim());
    let size = 0;
    let title = '';
    let domainMin = [0, 0, 0];
    let domainMax = [1, 1, 1];
    let is1D = false;
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#') || line === '') continue;

      if (line.startsWith('TITLE')) {
        title = line.substring(5).trim().replace(/"/g, '');
      } else if (line.startsWith('LUT_3D_SIZE')) {
        size = parseInt(line.split(/\s+/)[1]);
      } else if (line.startsWith('LUT_1D_SIZE')) {
        size = parseInt(line.split(/\s+/)[1]);
        is1D = true;
      } else if (line.startsWith('DOMAIN_MIN')) {
        const parts = line.split(/\s+/);
        domainMin = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
      } else if (line.startsWith('DOMAIN_MAX')) {
        const parts = line.split(/\s+/);
        domainMax = [parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
      } else {
        const parts = line.split(/\s+/).filter(p => p !== '');
        if (parts.length === 3 && !isNaN(parseFloat(parts[0]))) {
          dataLines.push(line);
        }
      }
    }

    if (size === 0) {
      throw new Error('Invalid LUT file: missing size declaration');
    }

    if (is1D) {
      return this.parse1DData(dataLines, size, title);
    } else {
      return this.parse3DData(dataLines, size, title, domainMin, domainMax);
    }
  }

  static async parse3dl(fileContent: string): Promise<LUT> {
    const lines = fileContent.split('\n').map(line => line.trim());
    const dataLines: string[] = [];
    let size = 0;

    for (const line of lines) {
      if (line === '' || line.startsWith('#')) continue;

      const parts = line.split(/\s+/);
      if (parts.length === 3 && !isNaN(parseFloat(parts[0]))) {
        dataLines.push(line);
      }
    }

    size = Math.round(Math.cbrt(dataLines.length));

    if (size * size * size !== dataLines.length) {
      throw new Error('Invalid 3DL file: data count is not a perfect cube');
    }

    return this.parse3DData(dataLines, size, '3DL Import', [0, 0, 0], [1, 1, 1]);
  }

  private static parse3DData(
    dataLines: string[],
    size: number,
    title: string,
    domainMin: number[],
    domainMax: number[]
  ): LUT3D {
    const data: [number, number, number][][][] = [];

    for (let b = 0; b < size; b++) {
      data[b] = [];
      for (let g = 0; g < size; g++) {
        data[b][g] = [];
        for (let r = 0; r < size; r++) {
          const idx = b * size * size + g * size + r;
          if (idx >= dataLines.length) {
            throw new Error('Invalid LUT file: insufficient data');
          }
          const parts = dataLines[idx].split(/\s+/);
          data[b][g][r] = [
            parseFloat(parts[0]),
            parseFloat(parts[1]),
            parseFloat(parts[2])
          ];
        }
      }
    }

    return {
      type: '3D',
      size,
      data,
      title,
      domain: { min: domainMin, max: domainMax }
    };
  }

  private static parse1DData(dataLines: string[], size: number, title: string): LUT1D {
    const data: number[][] = [];

    for (let i = 0; i < size; i++) {
      if (i >= dataLines.length) {
        throw new Error('Invalid 1D LUT file: insufficient data');
      }
      const parts = dataLines[i].split(/\s+/);
      data[i] = [
        parseFloat(parts[0]),
        parseFloat(parts[1]),
        parseFloat(parts[2])
      ];
    }

    return {
      type: '1D',
      size,
      data,
      title
    };
  }

  static exportCube(lut: LUT): string {
    let output = '';

    if (lut.title) {
      output += `TITLE "${lut.title}"\n`;
    }

    if (lut.type === '3D') {
      output += `LUT_3D_SIZE ${lut.size}\n`;

      if (lut.domain) {
        output += `DOMAIN_MIN ${lut.domain.min.join(' ')}\n`;
        output += `DOMAIN_MAX ${lut.domain.max.join(' ')}\n`;
      }

      output += '\n';

      for (let b = 0; b < lut.size; b++) {
        for (let g = 0; g < lut.size; g++) {
          for (let r = 0; r < lut.size; r++) {
            const rgb = lut.data[b][g][r];
            output += `${rgb[0].toFixed(6)} ${rgb[1].toFixed(6)} ${rgb[2].toFixed(6)}\n`;
          }
        }
      }
    } else {
      output += `LUT_1D_SIZE ${lut.size}\n\n`;

      for (let i = 0; i < lut.size; i++) {
        const rgb = lut.data[i];
        output += `${rgb[0].toFixed(6)} ${rgb[1].toFixed(6)} ${rgb[2].toFixed(6)}\n`;
      }
    }

    return output;
  }
}
