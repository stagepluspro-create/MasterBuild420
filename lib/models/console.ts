import { ID, Timestamp } from './common';
export type NetworkProtocol = 'Dante' | 'AVB' | 'AES50' | 'MADI' | 'Waves' | 'DVS' | 'None' | 'Waves NX';
export interface IConsole {
  id: ID;
  brand: string;
  model: string;
  inputs?: number;
  outputs?: number;
  buses?: number;
  matrixOutputs?: number;
  network?: NetworkProtocol[];
  supportedSampleRates?: string[];
  remoteControl?: boolean;
  fileFormats?: string[];
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
