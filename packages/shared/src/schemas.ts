import { z } from "zod";

export const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const GenerationOutputSchema = z.object({
  files: z.array(GeneratedFileSchema),
  metadata: z.record(z.any()).optional(),
});

export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;



