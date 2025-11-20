import { ID, Timestamp } from './common';
export type SpeakerType = 'Line Array' | 'Point Source' | 'Subwoofer' | 'Stage Monitor' | 'Column Array' | 'Install';
export interface ISpeaker {
  id: ID;
  brand: string;
  model: string;
  type: SpeakerType;
  maxSPLdB?: number;
  coverage?: string;
  frequencyResponseHz?: string;
  sensitivitydB?: number;
  powerRatingW?: number;
  riggingOptions?: string[];
  dimensions?: { w_mm?: number; h_mm?: number; d_mm?: number };
  weightKg?: number;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
