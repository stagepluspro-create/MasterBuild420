import { ID, Timestamp } from './common';
export type FixtureCategory = 'Beam' | 'Spot' | 'Wash' | 'Profile' | 'Hybrid' | 'LED Panel' | 'Moving Head' | 'Strobe' | 'Blinder' | 'Followspot';
export interface IDMXMode { modeId: string; channels: number; description?: string; }
export interface IPhotometric { iesFile?: string; luxAt1m?: number; spreadDeg?: string; }
export interface IPhysical { weightKg?: number; powerW?: number; panDeg?: number; tiltDeg?: number; dimensionsMm?: { w?: number; h?: number; d?: number }; }
export interface IFixture {
  id: ID;
  brand: string;
  model: string;
  category: FixtureCategory;
  dmxModes?: IDMXMode[];
  photometric?: IPhotometric;
  physical?: IPhysical;
  gobos?: number;
  colorEngine?: string | null;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
