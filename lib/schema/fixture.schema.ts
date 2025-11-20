import { z } from 'zod';
const DMXModeSchema = z.object({ modeId: z.string(), channels: z.number().int(), description: z.string().optional() });
const PhotometricSchema = z.object({ iesFile: z.string().optional(), luxAt1m: z.number().optional(), spreadDeg: z.string().optional() });
const PhysicalSchema = z.object({ weightKg: z.number().optional(), powerW: z.number().optional(), panDeg: z.number().optional(), tiltDeg: z.number().optional(), dimensionsMm: z.record(z.number()).optional() });
export const FixtureSchema = z.object({
  id: z.string(),
  brand: z.string(),
  model: z.string(),
  category: z.enum(['Beam','Spot','Wash','Profile','Hybrid','LED Panel','Moving Head','Strobe','Blinder','Followspot']),
  dmxModes: z.array(DMXModeSchema).optional(),
  photometric: PhotometricSchema.optional(),
  physical: PhysicalSchema.optional(),
  gobos: z.number().optional(),
  colorEngine: z.string().optional(),
  notes: z.string().optional(),
});
