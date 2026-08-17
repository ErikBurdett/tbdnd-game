import { z } from "zod";
import { ContentIdSchema, ContentRecordBaseSchema } from "./common";

export const ProvinceSchema = ContentRecordBaseSchema.extend({
  ownerFactionId: ContentIdSchema,
  neighborIds: z.array(ContentIdSchema),
  terrain: z.enum([
    "plains",
    "hills",
    "mountains",
    "forest",
    "desert",
    "marsh",
    "coast",
    "river-valley",
  ]),
  strategicPosition: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }),
  settlementLevel: z.number().int().min(0).max(5),
  baseResources: z.object({
    food: z.number().int().nonnegative(),
    wealth: z.number().int().nonnegative(),
    manpower: z.number().int().nonnegative(),
  }),
  historicalPlaceRefs: z
    .array(
      z.object({
        authority: z.enum(["pleiades", "open-historical-map", "other"]),
        identifier: z.string().min(1).max(200),
      }),
    )
    .default([]),
});

export type ProvinceDefinition = z.infer<typeof ProvinceSchema>;
