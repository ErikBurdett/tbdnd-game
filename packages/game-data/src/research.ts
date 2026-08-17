import { z } from "zod";
import { ContentIdSchema, ContentRecordBaseSchema } from "./common";

export const ResearchDomainSchema = z.enum([
  "magic",
  "science",
  "technology",
  "culture",
  "statecraft",
]);

export const ResearchSchema = ContentRecordBaseSchema.extend({
  domain: ResearchDomainSchema,
  tier: z.number().int().min(0).max(10),
  cost: z.number().int().positive(),
  prerequisiteIds: z.array(ContentIdSchema).default([]),
  unlockTags: z.array(ContentIdSchema).default([]),
});

export type ResearchDefinition = z.infer<typeof ResearchSchema>;
