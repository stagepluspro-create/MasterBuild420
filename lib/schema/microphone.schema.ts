import { z } from 'zod';
export const MicrophoneSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  type: z.enum(['Dynamic','Condenser','Ribbon','Boundary','Lavalier','Shotgun']),
  polarPattern: z.union([z.string(), z.array(z.string())]).optional(),
  maxSPLdB: z.number().int().optional(),
  selfNoisedB: z.number().optional().nullable(),
  frequencyResponseHz: z.string().optional(),
  proximityEffect: z.boolean().optional(),
  capsuleType: z.string().optional(),
  intendedUse: z.array(z.string()).optional(),
  irSamples: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
