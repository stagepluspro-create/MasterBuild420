import type { CShow, FixtureMapping, ConversionConflict } from './types';

export interface ValidationResult {
  isValid: boolean;
  conflicts: ConversionConflict[];
  warnings: string[];
  summary: {
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

export class ValidationEngine {
  validate(show: CShow, mappings: FixtureMapping[]): ValidationResult {
    const conflicts: ConversionConflict[] = [];
    const warnings: string[] = [];

    conflicts.push(...this.validateAddresses(show));
    conflicts.push(...this.validateChannelOverflow(show));
    conflicts.push(...this.validateMappingQuality(mappings));
    conflicts.push(...this.validateUniverseUsage(show));

    warnings.push(...this.generateWarnings(show, mappings));

    const summary = {
      criticalIssues: conflicts.filter(c => c.severity === 'critical').length,
      highIssues: conflicts.filter(c => c.severity === 'high').length,
      mediumIssues: conflicts.filter(c => c.severity === 'medium').length,
      lowIssues: conflicts.filter(c => c.severity === 'low').length
    };

    return {
      isValid: summary.criticalIssues === 0 && summary.highIssues === 0,
      conflicts,
      warnings,
      summary
    };
  }

  private validateAddresses(show: CShow): ConversionConflict[] {
    const conflicts: ConversionConflict[] = [];
    const addressMap = new Map<string, string[]>();

    for (const fixture of show.patch.fixtures) {
      if (!fixture.patchedAddress) {
        conflicts.push({
          type: 'unmappable_attribute',
          severity: 'high',
          message: `Fixture ${fixture.id} has no DMX address assigned`,
          fixtureId: fixture.id,
          suggestedFix: 'Run address allocation or manually assign an address'
        });
        continue;
      }

      const channels = fixture.channels || 1;
      for (let offset = 0; offset < channels; offset++) {
        const channelAddress = fixture.patchedAddress.address + offset;
        const key = `${fixture.patchedAddress.universe}.${channelAddress}`;

        const existing = addressMap.get(key) || [];
        existing.push(fixture.id);
        addressMap.set(key, existing);
      }
    }

    for (const [address, fixtureIds] of addressMap.entries()) {
      if (fixtureIds.length > 1) {
        const uniqueFixtures = [...new Set(fixtureIds)];
        if (uniqueFixtures.length > 1) {
          conflicts.push({
            type: 'duplicate_address',
            severity: 'critical',
            message: `Address conflict at ${address} between fixtures: ${uniqueFixtures.join(', ')}`,
            suggestedFix: 'Re-allocate addresses to avoid overlap'
          });
        }
      }
    }

    return conflicts;
  }

  private validateChannelOverflow(show: CShow): ConversionConflict[] {
    const conflicts: ConversionConflict[] = [];

    for (const fixture of show.patch.fixtures) {
      if (!fixture.patchedAddress || !fixture.channels) continue;

      const lastChannel = fixture.patchedAddress.address + fixture.channels - 1;

      if (lastChannel > 512) {
        conflicts.push({
          type: 'channel_overflow',
          severity: 'critical',
          message: `Fixture ${fixture.id} extends beyond universe limit (address ${fixture.patchedAddress.address} + ${fixture.channels} channels = ${lastChannel})`,
          fixtureId: fixture.id,
          suggestedFix: 'Move fixture to a new universe or use a smaller mode'
        });
      }
    }

    return conflicts;
  }

  private validateMappingQuality(mappings: FixtureMapping[]): ConversionConflict[] {
    const conflicts: ConversionConflict[] = [];

    for (const mapping of mappings) {
      if (mapping.confidenceScore < 30) {
        conflicts.push({
          type: 'mode_incompatible',
          severity: 'high',
          message: `Low confidence mapping for fixture ${mapping.fixtureId} (${mapping.confidenceScore}%)`,
          fixtureId: mapping.fixtureId,
          suggestedFix: 'Manually select a better target fixture or mode'
        });
      }

      if (mapping.warnings.length > 0) {
        for (const warning of mapping.warnings) {
          conflicts.push({
            type: 'unmappable_attribute',
            severity: 'medium',
            message: `Fixture ${mapping.fixtureId}: ${warning}`,
            fixtureId: mapping.fixtureId,
            suggestedFix: 'Review mapping and adjust manually if needed'
          });
        }
      }
    }

    return conflicts;
  }

  private validateUniverseUsage(show: CShow): ConversionConflict[] {
    const conflicts: ConversionConflict[] = [];
    const maxUniverses = 64;

    if (show.patch.universeCount && show.patch.universeCount > maxUniverses) {
      conflicts.push({
        type: 'universe_overflow',
        severity: 'medium',
        message: `Show uses ${show.patch.universeCount} universes, which may exceed system limits`,
        suggestedFix: 'Consider consolidating fixtures or using a more efficient addressing scheme'
      });
    }

    return conflicts;
  }

  private generateWarnings(show: CShow, mappings: FixtureMapping[]): string[] {
    const warnings: string[] = [];

    const unmappedFixtures = show.patch.fixtures.filter(f =>
      !mappings.find(m => m.fixtureId === f.id)
    );

    if (unmappedFixtures.length > 0) {
      warnings.push(`${unmappedFixtures.length} fixtures have no mapping`);
    }

    const lowConfidence = mappings.filter(m => m.confidenceScore < 50).length;
    if (lowConfidence > 0) {
      warnings.push(`${lowConfidence} mappings have low confidence scores`);
    }

    if (show.cues.length === 0) {
      warnings.push('No cues found in source show');
    }

    return warnings;
  }
}
