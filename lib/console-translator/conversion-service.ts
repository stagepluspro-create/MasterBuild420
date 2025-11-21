import { GrandMA2Parser } from './parsers/grandma2-parser';
import { MappingEngine, type FixtureDBEntry } from './mapping-engine';
import { AddressAllocator } from './address-allocator';
import { ValidationEngine } from './validation-engine';
import { GenericExporter } from './exporters/generic-exporter';
import type { CShow, ConsoleVendor, ConversionResult, FixtureMapping, ParsedShowfile } from './types';

export class ConversionService {
  private mappingEngine: MappingEngine;
  private addressAllocator: AddressAllocator;
  private validationEngine: ValidationEngine;

  constructor() {
    this.mappingEngine = new MappingEngine();
    this.addressAllocator = new AddressAllocator();
    this.validationEngine = new ValidationEngine();
  }

  setFixtureDatabase(fixtures: FixtureDBEntry[]): void {
    this.mappingEngine.setFixtureDatabase(fixtures);
  }

  async parseShowfile(content: string, sourceVendor: ConsoleVendor): Promise<ParsedShowfile> {
    let parser;

    switch (sourceVendor) {
      case 'grandma2':
      case 'grandma3':
        parser = new GrandMA2Parser();
        break;
      default:
        throw new Error(`Unsupported source vendor: ${sourceVendor}`);
    }

    return await parser.parse(content);
  }

  async convertShow(
    sourceShow: CShow,
    targetVendor: ConsoleVendor,
    options: {
      startUniverse?: number;
      targetMappings?: Map<string, { manufacturer: string; model: string }>;
    } = {}
  ): Promise<ConversionResult> {
    const warnings: string[] = [];
    const mappings: FixtureMapping[] = [];

    for (const fixture of sourceShow.patch.fixtures) {
      const targetOverride = options.targetMappings?.get(fixture.id);

      const mapping = await this.mappingEngine.mapFixture(
        fixture,
        targetOverride?.manufacturer,
        targetOverride?.model
      );

      mappings.push(mapping);
    }

    const allocationResult = this.addressAllocator.allocateAddresses(
      sourceShow.patch.fixtures,
      mappings,
      options.startUniverse || 1
    );

    for (const allocation of allocationResult.allocatedFixtures) {
      const mapping = mappings.find(m => m.fixtureId === allocation.fixtureId);
      if (mapping) {
        mapping.targetAddress = allocation.address;
      }

      const fixture = sourceShow.patch.fixtures.find(f => f.id === allocation.fixtureId);
      if (fixture) {
        fixture.patchedAddress = allocation.address;
      }
    }

    const outputShow: CShow = {
      ...sourceShow,
      vendor: targetVendor,
      patch: {
        ...sourceShow.patch,
        universeCount: allocationResult.universesUsed
      }
    };

    const validation = this.validationEngine.validate(outputShow, mappings);

    const conflicts = [...allocationResult.conflicts, ...validation.conflicts];

    const fixturesMapped = mappings.filter(m => m.confidenceScore > 50).length;
    const fixturesUnmapped = mappings.length - fixturesMapped;
    const averageConfidence = mappings.length > 0
      ? mappings.reduce((sum, m) => sum + m.confidenceScore, 0) / mappings.length
      : 0;

    const channelsMapped = mappings.reduce((sum, m) => sum + m.channelMaps.length, 0);

    return {
      success: validation.isValid,
      outputShow,
      mappings,
      conflicts,
      warnings: [...warnings, ...validation.warnings],
      stats: {
        fixturesMapped,
        fixturesUnmapped,
        averageConfidence,
        universesUsed: allocationResult.universesUsed,
        channelsMapped
      }
    };
  }

  async exportShow(show: CShow, targetVendor: ConsoleVendor): Promise<string> {
    const exporter = new GenericExporter(targetVendor);
    return await exporter.export(show);
  }

  async fullConversion(
    sourceContent: string,
    sourceVendor: ConsoleVendor,
    targetVendor: ConsoleVendor,
    options?: {
      startUniverse?: number;
      targetMappings?: Map<string, { manufacturer: string; model: string }>;
    }
  ): Promise<{ result: ConversionResult; exported: string }> {
    const parsed = await this.parseShowfile(sourceContent, sourceVendor);

    if (parsed.parseErrors.length > 0) {
      throw new Error(`Parse errors: ${parsed.parseErrors.join(', ')}`);
    }

    const result = await this.convertShow(parsed.show, targetVendor, options);

    if (!result.outputShow) {
      throw new Error('Conversion failed: no output show generated');
    }

    const exported = await this.exportShow(result.outputShow, targetVendor);

    return { result, exported };
  }
}
