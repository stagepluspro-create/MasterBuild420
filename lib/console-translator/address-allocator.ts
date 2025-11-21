import type { CFixture, DMXAddress, FixtureMapping, ConversionConflict } from './types';

export interface AllocationResult {
  allocatedFixtures: Array<{ fixtureId: string; address: DMXAddress }>;
  conflicts: ConversionConflict[];
  universesUsed: number;
}

export class AddressAllocator {
  private maxChannelsPerUniverse = 512;

  allocateAddresses(
    fixtures: CFixture[],
    mappings: FixtureMapping[],
    startUniverse: number = 1
  ): AllocationResult {
    const allocatedFixtures: Array<{ fixtureId: string; address: DMXAddress }> = [];
    const conflicts: ConversionConflict[] = [];

    const sortedFixtures = [...fixtures].sort((a, b) => {
      const aChannels = this.getFixtureChannels(a, mappings);
      const bChannels = this.getFixtureChannels(b, mappings);
      return bChannels - aChannels;
    });

    const universes = new Map<number, number>();
    let currentUniverse = startUniverse;
    universes.set(currentUniverse, 1);

    for (const fixture of sortedFixtures) {
      const channels = this.getFixtureChannels(fixture, mappings);

      if (channels === 0) {
        conflicts.push({
          type: 'unmappable_attribute',
          severity: 'high',
          message: `Fixture ${fixture.id} has no channel information`,
          fixtureId: fixture.id,
          suggestedFix: 'Manually specify channel count or fixture mode'
        });
        continue;
      }

      let allocated = false;

      for (let universe = startUniverse; universe <= currentUniverse; universe++) {
        const currentAddress = universes.get(universe) || 1;

        if (currentAddress + channels - 1 <= this.maxChannelsPerUniverse) {
          const address: DMXAddress = {
            universe,
            address: currentAddress
          };

          allocatedFixtures.push({
            fixtureId: fixture.id,
            address
          });

          universes.set(universe, currentAddress + channels);
          allocated = true;
          break;
        }
      }

      if (!allocated) {
        currentUniverse++;
        universes.set(currentUniverse, 1);

        if (channels > this.maxChannelsPerUniverse) {
          conflicts.push({
            type: 'channel_overflow',
            severity: 'critical',
            message: `Fixture ${fixture.id} requires ${channels} channels, exceeding universe limit of ${this.maxChannelsPerUniverse}`,
            fixtureId: fixture.id,
            suggestedFix: 'Split fixture into multiple personalities or use a smaller mode'
          });
          continue;
        }

        const address: DMXAddress = {
          universe: currentUniverse,
          address: 1
        };

        allocatedFixtures.push({
          fixtureId: fixture.id,
          address
        });

        universes.set(currentUniverse, 1 + channels);
      }
    }

    const duplicateConflicts = this.detectDuplicateAddresses(allocatedFixtures, fixtures);
    conflicts.push(...duplicateConflicts);

    return {
      allocatedFixtures,
      conflicts,
      universesUsed: currentUniverse - startUniverse + 1
    };
  }

  private getFixtureChannels(fixture: CFixture, mappings: FixtureMapping[]): number {
    const mapping = mappings.find(m => m.fixtureId === fixture.id);

    if (mapping && mapping.channelMaps.length > 0) {
      return Math.max(...mapping.channelMaps.map(cm => cm.targetChannel));
    }

    if (fixture.channels) {
      return fixture.channels;
    }

    return 0;
  }

  private detectDuplicateAddresses(
    allocatedFixtures: Array<{ fixtureId: string; address: DMXAddress }>,
    fixtures: CFixture[]
  ): ConversionConflict[] {
    const conflicts: ConversionConflict[] = [];
    const addressMap = new Map<string, string[]>();

    for (const allocation of allocatedFixtures) {
      const key = `${allocation.address.universe}.${allocation.address.address}`;
      const existing = addressMap.get(key) || [];
      existing.push(allocation.fixtureId);
      addressMap.set(key, existing);
    }

    for (const [address, fixtureIds] of addressMap.entries()) {
      if (fixtureIds.length > 1) {
        conflicts.push({
          type: 'duplicate_address',
          severity: 'critical',
          message: `Multiple fixtures assigned to address ${address}: ${fixtureIds.join(', ')}`,
          suggestedFix: 'Re-allocate addresses or manually override conflicting fixtures'
        });
      }
    }

    return conflicts;
  }

  remapAddresses(
    fixtures: CFixture[],
    newAddresses: Map<string, DMXAddress>
  ): CFixture[] {
    return fixtures.map(fixture => {
      const newAddress = newAddresses.get(fixture.id);
      if (newAddress) {
        return {
          ...fixture,
          patchedAddress: newAddress
        };
      }
      return fixture;
    });
  }
}
