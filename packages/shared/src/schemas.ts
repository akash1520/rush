import { z } from "zod";

// File schemas
export const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const GenerationOutputSchema = z.object({
  files: z.array(GeneratedFileSchema),
  metadata: z.record(z.any()).optional(),
});

// API Response schemas
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const FileSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  path: z.string(),
  localPath: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProjectWithFilesSchema = ProjectSchema.extend({
  files: z.array(FileSchema),
});

// Request schemas
export const ProjectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

export const FileUpsertSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const GenerateRequestSchema = z.object({
  projectId: z.string(),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
});

// Health check schema
export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  database: z.string(),
  filesystem: z.string(),
});

// Export types
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type FileRecord = z.infer<typeof FileSchema>;
export type ProjectWithFiles = z.infer<typeof ProjectWithFilesSchema>;
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type FileUpsert = z.infer<typeof FileUpsertSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;



