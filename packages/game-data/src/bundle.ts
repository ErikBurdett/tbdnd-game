import { z } from "zod";
import { BuildingSchema } from "./building";
import { FactionSchema } from "./faction";
import { ProvinceSchema } from "./province";
import { ResearchSchema } from "./research";
import { SourceSchema } from "./source";
import { UnitSchema } from "./unit";

export const GAME_DATA_SCHEMA_VERSION = 1 as const;

export const ContentBundleSchema = z.object({
  schemaVersion: z.literal(GAME_DATA_SCHEMA_VERSION),
  contentVersion: z.string().min(1).max(50),
  sources: z.array(SourceSchema),
  factions: z.array(FactionSchema),
  provinces: z.array(ProvinceSchema),
  units: z.array(UnitSchema),
  buildings: z.array(BuildingSchema),
  research: z.array(ResearchSchema),
});

export type ContentBundle = z.infer<typeof ContentBundleSchema>;
