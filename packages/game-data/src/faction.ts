import { z } from "zod";
import { ContentIdSchema, ContentRecordBaseSchema } from "./common";

export const FactionSchema = ContentRecordBaseSchema.extend({
  playable: z.boolean(),
  capitalProvinceId: ContentIdSchema,
  government: z.string().min(1).max(120),
  culturalTraditions: z.array(ContentIdSchema).min(1),
  strategicIdentity: z.object({
    strengths: z.array(z.string().min(1).max(200)).min(1),
    pressures: z.array(z.string().min(1).max(200)).min(1),
  }),
  fantasyLayer: z.object({
    prevalence: z.enum(["low", "moderate", "high"]),
    originalPremise: z.string().min(1).max(600),
  }),
});

export type FactionDefinition = z.infer<typeof FactionSchema>;
