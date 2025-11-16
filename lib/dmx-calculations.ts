import { DMXFixture } from "./dmx-service";

export interface AddressCalculation {
  startAddress: number;
  endAddress: number;
  channelCount: number;
  valid: boolean;
  error?: string;
}

export interface UniverseDistribution {
  universe: number;
  fixtures: DMXFixture[];
  usedChannels: number;
  availableChannels: number;
  usagePercent: number;
}

export interface AutoAddressResult {
  fixtures: Array<{
    name: string;
    universe: number;
    startAddress: number;
    endAddress: number;
    channelCount: number;
  }>;
  universesUsed: number;
  totalChannels: number;
}

export const dmxCalculations = {
  calculateEndAddress(startAddress: number, channelCount: number): number {
    return startAddress + channelCount - 1;
  },

  validateAddressRange(
    startAddress: number,
    channelCount: number
  ): AddressCalculation {
    if (startAddress < 1) {
      return {
        startAddress,
        endAddress: 0,
        channelCount,
        valid: false,
        error: "Start address must be at least 1",
      };
    }

    if (startAddress > 512) {
      return {
        startAddress,
        endAddress: 0,
        channelCount,
        valid: false,
        error: "Start address cannot exceed 512",
      };
    }

    if (channelCount < 1) {
      return {
        startAddress,
        endAddress: 0,
        channelCount,
        valid: false,
        error: "Channel count must be at least 1",
      };
    }

    const endAddress = this.calculateEndAddress(startAddress, channelCount);

    if (endAddress > 512) {
      return {
        startAddress,
        endAddress,
        channelCount,
        valid: false,
        error: `Fixture exceeds universe capacity (end address: ${endAddress})`,
      };
    }

    return {
      startAddress,
      endAddress,
      channelCount,
      valid: true,
    };
  },

  checkOverlap(
    address1Start: number,
    address1End: number,
    address2Start: number,
    address2End: number
  ): boolean {
    return address1Start <= address2End && address1End >= address2Start;
  },

  findOverlappingFixtures(
    fixtures: DMXFixture[],
    universe: number,
    startAddress: number,
    endAddress: number,
    excludeFixtureId?: string
  ): DMXFixture[] {
    return fixtures.filter(
      (f) =>
        f.universe === universe &&
        f.id !== excludeFixtureId &&
        this.checkOverlap(
          f.start_address,
          f.end_address,
          startAddress,
          endAddress
        )
    );
  },

  getAllOverlaps(fixtures: DMXFixture[]): Array<{
    fixture1: DMXFixture;
    fixture2: DMXFixture;
  }> {
    const overlaps: Array<{ fixture1: DMXFixture; fixture2: DMXFixture }> = [];

    for (let i = 0; i < fixtures.length; i++) {
      for (let j = i + 1; j < fixtures.length; j++) {
        const f1 = fixtures[i];
        const f2 = fixtures[j];

        if (
          f1.universe === f2.universe &&
          this.checkOverlap(
            f1.start_address,
            f1.end_address,
            f2.start_address,
            f2.end_address
          )
        ) {
          overlaps.push({ fixture1: f1, fixture2: f2 });
        }
      }
    }

    return overlaps;
  },

  findAddressGaps(
    fixtures: DMXFixture[],
    universe: number
  ): Array<{ start: number; end: number; size: number }> {
    const universeFixtures = fixtures
      .filter((f) => f.universe === universe)
      .sort((a, b) => a.start_address - b.start_address);

    if (universeFixtures.length === 0) {
      return [{ start: 1, end: 512, size: 512 }];
    }

    const gaps: Array<{ start: number; end: number; size: number }> = [];

    if (universeFixtures[0].start_address > 1) {
      const gapSize = universeFixtures[0].start_address - 1;
      gaps.push({ start: 1, end: universeFixtures[0].start_address - 1, size: gapSize });
    }

    for (let i = 0; i < universeFixtures.length - 1; i++) {
      const current = universeFixtures[i];
      const next = universeFixtures[i + 1];
      const gapStart = current.end_address + 1;
      const gapEnd = next.start_address - 1;

      if (gapEnd >= gapStart) {
        gaps.push({ start: gapStart, end: gapEnd, size: gapEnd - gapStart + 1 });
      }
    }

    const lastFixture = universeFixtures[universeFixtures.length - 1];
    if (lastFixture.end_address < 512) {
      const gapSize = 512 - lastFixture.end_address;
      gaps.push({ start: lastFixture.end_address + 1, end: 512, size: gapSize });
    }

    return gaps;
  },

  calculateUniverseUsage(
    fixtures: DMXFixture[],
    universe: number
  ): {
    usedChannels: number;
    availableChannels: number;
    usagePercent: number;
    fixtureCount: number;
  } {
    const universeFixtures = fixtures.filter((f) => f.universe === universe);
    const usedChannels = universeFixtures.reduce(
      (sum, f) => sum + f.channel_count,
      0
    );
    const availableChannels = 512 - usedChannels;
    const usagePercent = (usedChannels / 512) * 100;

    return {
      usedChannels,
      availableChannels,
      usagePercent: Math.round(usagePercent * 100) / 100,
      fixtureCount: universeFixtures.length,
    };
  },

  getUniverseDistribution(fixtures: DMXFixture[]): UniverseDistribution[] {
    const universeNumbers = Array.from(
      new Set(fixtures.map((f) => f.universe))
    ).sort((a, b) => a - b);

    return universeNumbers.map((universe) => {
      const universeFixtures = fixtures.filter((f) => f.universe === universe);
      const usage = this.calculateUniverseUsage(fixtures, universe);

      return {
        universe,
        fixtures: universeFixtures,
        usedChannels: usage.usedChannels,
        availableChannels: usage.availableChannels,
        usagePercent: usage.usagePercent,
      };
    });
  },

  autoAssignAddresses(
    fixtureTemplates: Array<{
      name: string;
      channelCount: number;
      quantity: number;
    }>,
    startUniverse: number = 1,
    startAddress: number = 1
  ): AutoAddressResult {
    const result: AutoAddressResult = {
      fixtures: [],
      universesUsed: 0,
      totalChannels: 0,
    };

    let currentUniverse = startUniverse;
    let currentAddress = startAddress;

    for (const template of fixtureTemplates) {
      for (let i = 1; i <= template.quantity; i++) {
        const endAddress = currentAddress + template.channelCount - 1;

        if (endAddress > 512) {
          currentUniverse++;
          currentAddress = 1;
        }

        const fixtureEndAddress = currentAddress + template.channelCount - 1;

        result.fixtures.push({
          name: template.quantity > 1 ? `${template.name} ${i}` : template.name,
          universe: currentUniverse,
          startAddress: currentAddress,
          endAddress: fixtureEndAddress,
          channelCount: template.channelCount,
        });

        currentAddress = fixtureEndAddress + 1;
        result.totalChannels += template.channelCount;
      }
    }

    result.universesUsed = currentUniverse - startUniverse + 1;

    return result;
  },

  shiftAddresses(
    fixtures: DMXFixture[],
    fixtureIds: string[],
    offset: number
  ): Array<{ id: string; newStartAddress: number; newEndAddress: number }> {
    const results: Array<{
      id: string;
      newStartAddress: number;
      newEndAddress: number;
    }> = [];

    for (const fixture of fixtures) {
      if (fixtureIds.includes(fixture.id)) {
        const newStartAddress = fixture.start_address + offset;
        const newEndAddress = fixture.end_address + offset;

        if (newStartAddress >= 1 && newEndAddress <= 512) {
          results.push({
            id: fixture.id,
            newStartAddress,
            newEndAddress,
          });
        }
      }
    }

    return results;
  },

  compressAddresses(fixtures: DMXFixture[], universe: number): Array<{
    id: string;
    newStartAddress: number;
    newEndAddress: number;
  }> {
    const universeFixtures = fixtures
      .filter((f) => f.universe === universe)
      .sort((a, b) => a.start_address - b.start_address);

    const results: Array<{
      id: string;
      newStartAddress: number;
      newEndAddress: number;
    }> = [];

    let nextAddress = 1;

    for (const fixture of universeFixtures) {
      results.push({
        id: fixture.id,
        newStartAddress: nextAddress,
        newEndAddress: nextAddress + fixture.channel_count - 1,
      });
      nextAddress += fixture.channel_count;
    }

    return results;
  },

  balanceUniverses(
    fixtures: Array<{ name: string; channelCount: number }>,
    maxUniverses: number
  ): UniverseDistribution[] {
    const totalChannels = fixtures.reduce((sum, f) => sum + f.channelCount, 0);
    const channelsPerUniverse = Math.ceil(totalChannels / maxUniverses);

    const distribution: UniverseDistribution[] = [];
    let currentUniverse = 1;
    let currentChannels = 0;
    let currentUniverseFixtures: DMXFixture[] = [];
    let currentAddress = 1;

    for (const fixture of fixtures) {
      if (
        currentChannels + fixture.channelCount > 512 ||
        (currentChannels > 0 &&
          currentChannels + fixture.channelCount > channelsPerUniverse)
      ) {
        distribution.push({
          universe: currentUniverse,
          fixtures: currentUniverseFixtures,
          usedChannels: currentChannels,
          availableChannels: 512 - currentChannels,
          usagePercent: (currentChannels / 512) * 100,
        });

        currentUniverse++;
        currentChannels = 0;
        currentUniverseFixtures = [];
        currentAddress = 1;
      }

      const mockFixture: DMXFixture = {
        id: `temp-${currentUniverse}-${currentAddress}`,
        patch_id: "",
        universe_id: "",
        fixture_name: fixture.name,
        universe: currentUniverse,
        start_address: currentAddress,
        end_address: currentAddress + fixture.channelCount - 1,
        channel_count: fixture.channelCount,
        quantity: 1,
        unit_number: 1,
        order_index: 0,
        created_at: "",
        updated_at: "",
      };

      currentUniverseFixtures.push(mockFixture);
      currentChannels += fixture.channelCount;
      currentAddress += fixture.channelCount;
    }

    if (currentUniverseFixtures.length > 0) {
      distribution.push({
        universe: currentUniverse,
        fixtures: currentUniverseFixtures,
        usedChannels: currentChannels,
        availableChannels: 512 - currentChannels,
        usagePercent: (currentChannels / 512) * 100,
      });
    }

    return distribution;
  },

  findBestStartAddress(
    fixtures: DMXFixture[],
    universe: number,
    channelCount: number
  ): number | null {
    const gaps = this.findAddressGaps(fixtures, universe);

    for (const gap of gaps) {
      if (gap.size >= channelCount) {
        return gap.start;
      }
    }

    return null;
  },
};
