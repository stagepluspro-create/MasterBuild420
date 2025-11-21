import type { CShow, ConsoleVendor, ParsedShowfile } from '../types';

export abstract class ShowfileParser {
  protected vendor: ConsoleVendor;

  constructor(vendor: ConsoleVendor) {
    this.vendor = vendor;
  }

  abstract parse(fileContent: string | Buffer): Promise<ParsedShowfile>;

  protected createEmptyShow(name: string = 'Untitled Show'): CShow {
    return {
      id: `show_${Date.now()}`,
      name,
      vendor: this.vendor,
      patch: {
        fixtures: [],
        universeCount: 0
      },
      cues: [],
      palettes: [],
      metadata: {}
    };
  }

  protected normalizeManufacturerName(name: string): string {
    const normalizationMap: Record<string, string> = {
      'MA Lighting': 'MA Lighting',
      'ma lighting': 'MA Lighting',
      'robe': 'Robe',
      'ROBE': 'Robe',
      'clay paky': 'Clay Paky',
      'claypaky': 'Clay Paky',
      'etc': 'ETC',
      'ETC': 'ETC',
      'martin': 'Martin',
      'MARTIN': 'Martin',
      'chauvet': 'Chauvet',
      'CHAUVET': 'Chauvet'
    };

    return normalizationMap[name] || name;
  }

  protected normalizeModelName(model: string): string {
    return model.trim();
  }
}
