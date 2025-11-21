import type { CFixture, FixtureMapping, ChannelMapping, DMXAddress } from './types';

export interface FixtureDBEntry {
  id: string;
  manufacturer: string;
  model: string;
  modes?: Array<{
    name: string;
    channels: number;
    attributes?: Record<string, number>;
  }>;
}

export class MappingEngine {
  private fixtureDatabase: FixtureDBEntry[] = [];

  setFixtureDatabase(fixtures: FixtureDBEntry[]): void {
    this.fixtureDatabase = fixtures;
  }

  async mapFixture(
    sourceFixture: CFixture,
    targetManufacturer?: string,
    targetModel?: string
  ): Promise<FixtureMapping> {
    const warnings: string[] = [];

    const sourceDBEntry = this.findFixtureInDB(
      sourceFixture.manufacturer || '',
      sourceFixture.model || ''
    );

    if (!sourceDBEntry) {
      warnings.push('Source fixture not found in database');
    }

    let targetDBEntry: FixtureDBEntry | null = null;

    if (targetManufacturer && targetModel) {
      targetDBEntry = this.findFixtureInDB(targetManufacturer, targetModel);
    } else {
      targetDBEntry = sourceDBEntry;
    }

    if (!targetDBEntry) {
      warnings.push('Target fixture not found in database');
      targetDBEntry = sourceDBEntry;
    }

    const sourceMode = this.findBestMode(sourceDBEntry, sourceFixture.mode);
    const targetMode = this.findBestMode(targetDBEntry, undefined, sourceMode?.channels);

    const channelMaps = this.generateChannelMappings(sourceMode, targetMode);
    const confidenceScore = this.calculateConfidenceScore(sourceMode, targetMode, channelMaps);

    if (sourceMode && targetMode && sourceMode.channels !== targetMode.channels) {
      warnings.push(`Channel count mismatch: ${sourceMode.channels} → ${targetMode.channels}`);
    }

    return {
      fixtureId: sourceFixture.id,
      sourceManufacturer: sourceFixture.manufacturer || 'Unknown',
      sourceModel: sourceFixture.model || 'Unknown',
      sourceMode: sourceMode?.name,
      targetManufacturer: targetDBEntry?.manufacturer || sourceFixture.manufacturer || 'Unknown',
      targetModel: targetDBEntry?.model || sourceFixture.model || 'Unknown',
      targetMode: targetMode?.name,
      targetAddress: sourceFixture.patchedAddress,
      channelMaps,
      confidenceScore,
      warnings,
      isManualOverride: !!(targetManufacturer || targetModel)
    };
  }

  private findFixtureInDB(manufacturer: string, model: string): FixtureDBEntry | null {
    const normalizedManufacturer = manufacturer.toLowerCase().trim();
    const normalizedModel = model.toLowerCase().trim();

    return this.fixtureDatabase.find(f =>
      f.manufacturer.toLowerCase().includes(normalizedManufacturer) &&
      f.model.toLowerCase().includes(normalizedModel)
    ) || null;
  }

  private findBestMode(
    fixture: FixtureDBEntry | null,
    modeName?: string,
    targetChannels?: number
  ): { name: string; channels: number; attributes?: Record<string, number> } | null {
    if (!fixture || !fixture.modes || fixture.modes.length === 0) {
      return null;
    }

    if (modeName) {
      const exactMatch = fixture.modes.find(m =>
        m.name.toLowerCase() === modeName.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }

    if (targetChannels) {
      const channelMatch = fixture.modes.find(m => m.channels === targetChannels);
      if (channelMatch) return channelMatch;

      const closestMatch = fixture.modes.reduce((prev, curr) =>
        Math.abs(curr.channels - targetChannels) < Math.abs(prev.channels - targetChannels) ? curr : prev
      );
      return closestMatch;
    }

    return fixture.modes[0];
  }

  private generateChannelMappings(
    sourceMode: { name: string; channels: number; attributes?: Record<string, number> } | null,
    targetMode: { name: string; channels: number; attributes?: Record<string, number> } | null
  ): ChannelMapping[] {
    const mappings: ChannelMapping[] = [];

    if (!sourceMode || !targetMode) {
      return mappings;
    }

    if (sourceMode.attributes && targetMode.attributes) {
      const commonAttributes = this.findCommonAttributes(sourceMode.attributes, targetMode.attributes);

      for (const attr of commonAttributes) {
        mappings.push({
          sourceChannel: sourceMode.attributes[attr],
          targetChannel: targetMode.attributes[attr],
          sourceAttribute: attr,
          targetAttribute: attr
        });
      }
    } else {
      const minChannels = Math.min(sourceMode.channels, targetMode.channels);
      for (let i = 1; i <= minChannels; i++) {
        mappings.push({
          sourceChannel: i,
          targetChannel: i
        });
      }
    }

    return mappings;
  }

  private findCommonAttributes(
    sourceAttrs: Record<string, number>,
    targetAttrs: Record<string, number>
  ): string[] {
    const sourceKeys = new Set(Object.keys(sourceAttrs).map(k => k.toLowerCase()));
    const targetKeys = Object.keys(targetAttrs);

    return targetKeys.filter(key => sourceKeys.has(key.toLowerCase()));
  }

  private calculateConfidenceScore(
    sourceMode: { name: string; channels: number; attributes?: Record<string, number> } | null,
    targetMode: { name: string; channels: number; attributes?: Record<string, number> } | null,
    channelMaps: ChannelMapping[]
  ): number {
    if (!sourceMode || !targetMode) {
      return 0;
    }

    let score = 50;

    if (sourceMode.channels === targetMode.channels) {
      score += 20;
    } else if (Math.abs(sourceMode.channels - targetMode.channels) <= 5) {
      score += 10;
    }

    if (channelMaps.length > 0) {
      score += Math.min(30, channelMaps.length * 3);
    }

    const essentialAttributes = ['intensity', 'dimmer', 'pan', 'tilt'];
    if (sourceMode.attributes && targetMode.attributes) {
      for (const attr of essentialAttributes) {
        if (sourceMode.attributes[attr] && targetMode.attributes[attr]) {
          score += 5;
        }
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  async mapAllFixtures(
    fixtures: CFixture[],
    targetVendor?: string
  ): Promise<FixtureMapping[]> {
    const mappings: FixtureMapping[] = [];

    for (const fixture of fixtures) {
      const mapping = await this.mapFixture(fixture);
      mappings.push(mapping);
    }

    return mappings;
  }
}
