import { z } from 'zod';
export const SpeakerSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  type: z.enum(['Line Array','Point Source','Subwoofer','Stage Monitor','Column Array','Install']),
  maxSPLdB: z.number().optional(),
  coverage: z.string().optional(),
  frequencyResponseHz: z.string().optional(),
  sensitivitydB: z.number().optional(),
  powerRatingW: z.number().optional(),
  riggingOptions: z.array(z.string()).optional(),
  dimensions: z.object({ w_mm: z.number().optional(), h_mm: z.number().optional(), d_mm: z.number().optional() }).optional(),
  weightKg: z.number().optional(),
  notes: z.string().optional(),
});
