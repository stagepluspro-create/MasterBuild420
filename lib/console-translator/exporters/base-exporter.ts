import type { CShow, ConsoleVendor } from '../types';

export abstract class ShowfileExporter {
  protected targetVendor: ConsoleVendor;

  constructor(targetVendor: ConsoleVendor) {
    this.targetVendor = targetVendor;
  }

  abstract export(show: CShow): Promise<string>;

  protected formatDMXAddress(universe: number, address: number): string {
    return `${universe}.${address}`;
  }

  protected escapeString(str: string): string {
    return str.replace(/"/g, '\\"');
  }
}
