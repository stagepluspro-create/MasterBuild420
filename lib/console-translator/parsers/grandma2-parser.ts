import { ShowfileParser } from './base-parser';
import type { CFixture, CCue, CShow, ParsedShowfile } from '../types';

export class GrandMA2Parser extends ShowfileParser {
  constructor() {
    super('grandma2');
  }

  async parse(fileContent: string | Buffer): Promise<ParsedShowfile> {
    const content = typeof fileContent === 'string' ? fileContent : fileContent.toString('utf-8');
    const parseErrors: string[] = [];
    const parseWarnings: string[] = [];

    try {
      const show = this.parseGrandMA2Format(content, parseErrors, parseWarnings);

      return {
        vendor: this.vendor,
        show,
        parseErrors,
        parseWarnings
      };
    } catch (error: any) {
      parseErrors.push(`Fatal parse error: ${error.message}`);
      return {
        vendor: this.vendor,
        show: this.createEmptyShow(),
        parseErrors,
        parseWarnings
      };
    }
  }

  private parseGrandMA2Format(content: string, errors: string[], warnings: string[]): CShow {
    const lines = content.split('\n').map(l => l.trim());
    const show = this.createEmptyShow('grandMA2 Show');

    let currentFixtureId: string | null = null;
    let fixtureCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line || line.startsWith('//') || line.startsWith('#')) {
        continue;
      }

      if (line.includes('Patch') && line.includes('Fixture')) {
        const fixture = this.parseFixtureLine(line, fixtureCount++, errors);
        if (fixture) {
          show.patch.fixtures.push(fixture);
          currentFixtureId = fixture.id;
        }
      }

      else if (line.includes('Fixture') && (line.includes('Type') || line.includes('FID'))) {
        const fixture = this.parseFixtureDeclaration(line, fixtureCount++, errors);
        if (fixture) {
          show.patch.fixtures.push(fixture);
          currentFixtureId = fixture.id;
        }
      }

      else if (line.startsWith('Cue') && currentFixtureId) {
        const cue = this.parseCueLine(line, errors);
        if (cue) {
          show.cues.push(cue);
        }
      }

      else if (line.includes('Universe') || line.includes('DMX')) {
        this.parseUniverseInfo(line, show, errors);
      }
    }

    show.patch.universeCount = this.calculateUniverseCount(show.patch.fixtures);
    show.metadata = {
      parsedFixtures: show.patch.fixtures.length,
      parsedCues: show.cues.length,
      format: 'grandMA2'
    };

    if (show.patch.fixtures.length === 0) {
      warnings.push('No fixtures found in showfile');
    }

    return show;
  }

  private parseFixtureLine(line: string, index: number, errors: string[]): CFixture | null {
    try {
      const parts = line.split(/\s+/);
      const fixture: CFixture = {
        id: `fixture_${index}`,
        fixtureNumber: index + 1,
        originalFixtureRef: {
          vendor: 'grandma2',
          rawData: { line }
        }
      };

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].toLowerCase();

        if (part === 'fixture' && i + 1 < parts.length) {
          fixture.fixtureNumber = parseInt(parts[i + 1]) || index + 1;
        }

        if ((part === 'type' || part === 'fid') && i + 1 < parts.length) {
          const typeInfo = parts[i + 1];
          const [manufacturer, model] = this.parseFixtureType(typeInfo);
          fixture.manufacturer = manufacturer;
          fixture.model = model;
        }

        if ((part === 'dmx' || part === 'address') && i + 1 < parts.length) {
          const addressInfo = parts[i + 1];
          const dmxAddress = this.parseDMXAddress(addressInfo);
          if (dmxAddress) {
            fixture.patchedAddress = dmxAddress;
          }
        }

        if (part === 'mode' && i + 1 < parts.length) {
          fixture.mode = parts[i + 1];
        }

        if (part === 'channels' && i + 1 < parts.length) {
          fixture.channels = parseInt(parts[i + 1]) || undefined;
        }

        if (part === 'name' && i + 1 < parts.length) {
          fixture.name = parts.slice(i + 1).join(' ').replace(/['"]/g, '');
          break;
        }
      }

      return fixture;
    } catch (error: any) {
      errors.push(`Failed to parse fixture line: ${line} - ${error.message}`);
      return null;
    }
  }

  private parseFixtureDeclaration(line: string, index: number, errors: string[]): CFixture | null {
    try {
      const match = line.match(/Fixture\s+(\d+)\s+.*Type[:\s]+([^\s]+)\s+.*(?:Address|DMX)[:\s]+(\d+)\.(\d+)/i);

      if (match) {
        const [, fixtureNum, typeInfo, universe, address] = match;
        const [manufacturer, model] = this.parseFixtureType(typeInfo);

        return {
          id: `fixture_${index}`,
          fixtureNumber: parseInt(fixtureNum),
          manufacturer,
          model,
          patchedAddress: {
            universe: parseInt(universe),
            address: parseInt(address)
          },
          originalFixtureRef: {
            vendor: 'grandma2',
            rawData: { line }
          }
        };
      }

      return this.parseFixtureLine(line, index, errors);
    } catch (error: any) {
      errors.push(`Failed to parse fixture declaration: ${line} - ${error.message}`);
      return null;
    }
  }

  private parseFixtureType(typeInfo: string): [string, string] {
    const parts = typeInfo.split(/[._-]/);

    if (parts.length >= 2) {
      const manufacturer = this.normalizeManufacturerName(parts[0]);
      const model = this.normalizeModelName(parts.slice(1).join(' '));
      return [manufacturer, model];
    }

    return ['Unknown', typeInfo];
  }

  private parseDMXAddress(addressInfo: string): { universe: number; address: number } | null {
    const match = addressInfo.match(/(\d+)\.(\d+)/);
    if (match) {
      return {
        universe: parseInt(match[1]),
        address: parseInt(match[2])
      };
    }

    const simpleMatch = addressInfo.match(/^(\d+)$/);
    if (simpleMatch) {
      const addr = parseInt(simpleMatch[1]);
      return {
        universe: Math.floor(addr / 512) + 1,
        address: addr % 512 || 512
      };
    }

    return null;
  }

  private parseCueLine(line: string, errors: string[]): CCue | null {
    try {
      const match = line.match(/Cue\s+(\d+(?:\.\d+)?)\s*(?:"([^"]+)")?/i);

      if (match) {
        const [, cueNum, label] = match;
        return {
          id: `cue_${cueNum.replace('.', '_')}`,
          number: parseFloat(cueNum),
          label: label || undefined,
          parameters: []
        };
      }

      return null;
    } catch (error: any) {
      errors.push(`Failed to parse cue line: ${line} - ${error.message}`);
      return null;
    }
  }

  private parseUniverseInfo(line: string, show: CShow, errors: string[]): void {
    const match = line.match(/Universe\s+(\d+)/i);
    if (match) {
      const universeNum = parseInt(match[1]);
      if (show.patch.universeCount === undefined || universeNum > show.patch.universeCount) {
        show.patch.universeCount = universeNum;
      }
    }
  }

  private calculateUniverseCount(fixtures: CFixture[]): number {
    let maxUniverse = 0;

    for (const fixture of fixtures) {
      if (fixture.patchedAddress?.universe) {
        maxUniverse = Math.max(maxUniverse, fixture.patchedAddress.universe);
      }
    }

    return maxUniverse || 1;
  }
}
