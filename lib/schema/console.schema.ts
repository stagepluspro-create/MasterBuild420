import { z } from 'zod';
export const ConsoleSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  inputs: z.number().optional(),
  outputs: z.number().optional(),
  buses: z.number().optional(),
  matrixOutputs: z.number().optional(),
  network: z.array(z.string()).optional(),
  supportedSampleRates: z.array(z.string()).optional(),
  remoteControl: z.boolean().optional(),
  fileFormats: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
