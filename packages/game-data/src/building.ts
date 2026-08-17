import { z } from "zod";
import { ContentIdSchema, ContentRecordBaseSchema, ResourceCostSchema } from "./common";

export const BuildingSchema = ContentRecordBaseSchema.extend({
  constructionCost: ResourceCostSchema,
  constructionTurns: z.number().int().positive(),
  requiredResearchIds: z.array(ContentIdSchema).default([]),
  effects: z.object({
    foodPerTurn: z.number().int().default(0),
    wealthPerTurn: z.number().int().default(0),
    manpowerPerTurn: z.number().int().default(0),
    unrestPerTurn: z.number().int().default(0),
    recruitmentTags: z.array(ContentIdSchema).default([]),
  }),
});

export type BuildingDefinition = z.infer<typeof BuildingSchema>;
