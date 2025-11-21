import { ShowfileExporter } from './base-exporter';
import type { CShow } from '../types';

export class GenericExporter extends ShowfileExporter {
  async export(show: CShow): Promise<string> {
    const lines: string[] = [];

    lines.push(`# ${show.name}`);
    lines.push(`# Converted from ${show.vendor} to ${this.targetVendor}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push('');

    lines.push('# PATCH');
    lines.push('');

    for (const fixture of show.patch.fixtures) {
      const manufacturer = fixture.manufacturer || 'Unknown';
      const model = fixture.model || 'Unknown';
      const mode = fixture.mode || 'Standard';
      const address = fixture.patchedAddress
        ? this.formatDMXAddress(fixture.patchedAddress.universe, fixture.patchedAddress.address)
        : 'Unpatched';

      lines.push(`Fixture ${fixture.fixtureNumber || fixture.id}`);
      lines.push(`  Type: ${manufacturer}.${model}`);
      lines.push(`  Mode: ${mode}`);
      lines.push(`  Address: ${address}`);
      if (fixture.channels) {
        lines.push(`  Channels: ${fixture.channels}`);
      }
      if (fixture.name) {
        lines.push(`  Name: "${this.escapeString(fixture.name)}"`);
      }
      lines.push('');
    }

    if (show.cues.length > 0) {
      lines.push('# CUES');
      lines.push('');

      for (const cue of show.cues) {
        lines.push(`Cue ${cue.number || cue.id}`);
        if (cue.label) {
          lines.push(`  Label: "${this.escapeString(cue.label)}"`);
        }
        if (cue.fadeTime) {
          lines.push(`  Fade: ${cue.fadeTime}s`);
        }
        lines.push('');
      }
    }

    if (show.palettes && show.palettes.length > 0) {
      lines.push('# PALETTES');
      lines.push('');

      for (const palette of show.palettes) {
        lines.push(`Palette ${palette.id}`);
        lines.push(`  Type: ${palette.type}`);
        if (palette.name) {
          lines.push(`  Name: "${this.escapeString(palette.name)}"`);
        }
        lines.push('');
      }
    }

    lines.push('# METADATA');
    lines.push(`# Fixtures: ${show.patch.fixtures.length}`);
    lines.push(`# Universes: ${show.patch.universeCount || 0}`);
    lines.push(`# Cues: ${show.cues.length}`);
    lines.push('');

    return lines.join('\n');
  }
}
