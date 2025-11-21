export type ConsoleVendor = 'grandma2' | 'grandma3' | 'hog4' | 'eos' | 'avolites' | 'onyx' | 'chamsys' | 'unknown';

export interface DMXAddress {
  universe: number;
  address: number;
}

export interface Position3D {
  x?: number;
  y?: number;
  z?: number;
}

export interface CFixture {
  id: string;
  manufacturer?: string;
  model?: string;
  mode?: string;
  originalFixtureRef?: {
    vendor: ConsoleVendor;
    rawId?: string;
    rawData?: any;
  };
  patchedAddress?: DMXAddress;
  channels?: number;
  position?: Position3D;
  attributes?: Record<string, any>;
  fixtureNumber?: number;
  name?: string;
}

export interface CPatch {
  fixtures: CFixture[];
  universeCount?: number;
}

export interface CParameter {
  fixtureId: string;
  parameter: string;
  value: any;
  fadeTime?: number;
}

export interface CCue {
  id: string;
  number?: number;
  label?: string;
  time?: number;
  fadeTime?: number;
  followTime?: number;
  parameters: CParameter[];
}

export interface CPalette {
  id: string;
  type: 'color' | 'position' | 'beam' | 'intensity';
  name?: string;
  parameters: CParameter[];
}

export interface CShow {
  id: string;
  name: string;
  vendor: ConsoleVendor;
  patch: CPatch;
  cues: CCue[];
  palettes?: CPalette[];
  metadata?: Record<string, any>;
}

export interface ChannelMapping {
  sourceChannel: number;
  targetChannel: number;
  sourceAttribute?: string;
  targetAttribute?: string;
  valueTransform?: (value: number) => number;
}

export interface FixtureMapping {
  fixtureId: string;
  sourceManufacturer: string;
  sourceModel: string;
  sourceMode?: string;
  targetManufacturer: string;
  targetModel: string;
  targetMode?: string;
  targetAddress?: DMXAddress;
  channelMaps: ChannelMapping[];
  confidenceScore: number;
  warnings: string[];
  isManualOverride: boolean;
}

export interface ConversionConflict {
  type: 'duplicate_address' | 'channel_overflow' | 'unmappable_attribute' | 'universe_overflow' | 'mode_incompatible';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  fixtureId?: string;
  suggestedFix?: string;
}

export interface ConversionResult {
  success: boolean;
  outputShow?: CShow;
  mappings: FixtureMapping[];
  conflicts: ConversionConflict[];
  warnings: string[];
  stats: {
    fixturesMapped: number;
    fixturesUnmapped: number;
    averageConfidence: number;
    universesUsed: number;
    channelsMapped: number;
  };
}

export interface MappingProfile {
  id: string;
  name: string;
  description?: string;
  sourceVendor: ConsoleVendor;
  targetVendor: ConsoleVendor;
  rules: MappingRule[];
  isPublic: boolean;
}

export interface MappingRule {
  sourceManufacturer: string;
  sourceModel: string;
  targetManufacturer: string;
  targetModel: string;
  channelMaps?: ChannelMapping[];
  priority?: number;
}

export interface ParsedShowfile {
  vendor: ConsoleVendor;
  show: CShow;
  parseErrors: string[];
  parseWarnings: string[];
}
