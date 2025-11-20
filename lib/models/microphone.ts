import { ID, Timestamp } from './common';
export type MicrophoneType = 'Dynamic' | 'Condenser' | 'Ribbon' | 'Boundary' | 'Lavalier' | 'Shotgun';
export type PolarPattern = 'Cardioid' | 'Supercardioid' | 'Hypercardioid' | 'Omnidirectional' | 'Figure-8' | 'Multi';
export interface IMicrophone {
  id: ID;
  brand: string;
  model: string;
  type: MicrophoneType;
  polarPattern?: PolarPattern | PolarPattern[];
  maxSPLdB?: number;
  selfNoisedB?: number | null;
  frequencyResponseHz?: string;
  proximityEffect?: boolean;
  capsuleType?: string;
  intendedUse?: string[];
  irSamples?: string[];
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
