import { z } from "zod";
import { ContentIdSchema, ContentRecordBaseSchema, ResourceCostSchema } from "./common";

export const UnitSchema = ContentRecordBaseSchema.extend({
  factionIds: z.array(ContentIdSchema).min(1),
  scale: z.enum(["party", "formation"]),
  role: z.enum([
    "melee-infantry",
    "ranged-infantry",
    "cavalry",
    "skirmisher",
    "siege",
    "support",
    "hero",
  ]),
  recruitmentCost: ResourceCostSchema,
  upkeep: ResourceCostSchema,
  stats: z.object({
    strength: z.number().int().positive(),
    armor: z.number().int().nonnegative(),
    mobility: z.number().int().positive(),
    morale: z.number().int().min(1).max(100),
    range: z.number().int().nonnegative(),
  }),
  requiredResearchIds: z.array(ContentIdSchema).default([]),
});

export type UnitDefinition = z.infer<typeof UnitSchema>;
