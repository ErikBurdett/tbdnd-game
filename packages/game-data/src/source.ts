import { z } from "zod";
import { ContentIdSchema } from "./common";

export const SourceSchema = z.object({
  id: ContentIdSchema,
  title: z.string().min(1).max(300),
  creator: z.string().min(1).max(200),
  publisher: z.string().min(1).max(200).optional(),
  publicationYear: z.number().int().min(-3000).max(2200).optional(),
  url: z.url().optional(),
  accessedOn: z.iso.date().optional(),
  license: z.string().min(1).max(200).optional(),
  sourceType: z.enum([
    "primary-text",
    "secondary-scholarship",
    "historical-gazetteer",
    "geodata",
    "game-design",
    "internal",
  ]),
  notes: z.string().min(1).max(1_000).optional(),
});

export type SourceDefinition = z.infer<typeof SourceSchema>;
