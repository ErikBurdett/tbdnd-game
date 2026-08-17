import { z } from "zod";

export const ContentIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use stable kebab-case content IDs.");

export const ContentClassificationSchema = z.enum([
  "attested",
  "reconstructed",
  "composite",
  "invented-historical",
  "fantasy-divergence",
  "anachronistic-gameplay",
]);

export const CitationSchema = z.object({
  sourceId: ContentIdSchema,
  locator: z.string().min(1).max(200).optional(),
  note: z.string().min(1).max(500).optional(),
});

export const ContentRecordBaseSchema = z.object({
  id: ContentIdSchema,
  displayName: z.string().min(1).max(120),
  classification: ContentClassificationSchema,
  summary: z.string().min(1).max(1_000),
  tags: z.array(ContentIdSchema).default([]),
  citations: z.array(CitationSchema).default([]),
  prototypeNotes: z.array(z.string().min(1).max(500)).default([]),
});

export const ResourceCostSchema = z.object({
  wealth: z.number().int().nonnegative().default(0),
  food: z.number().int().nonnegative().default(0),
  manpower: z.number().int().nonnegative().default(0),
  influence: z.number().int().nonnegative().default(0),
});

export type ContentClassification = z.infer<typeof ContentClassificationSchema>;
