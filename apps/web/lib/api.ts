import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Project,
  ProjectCreate,
  FileRecord,
  ProjectWithFiles,
  FileUpsert,
  GenerateRequest,
  HealthResponse,
} from '../../../packages/shared/src/schemas';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Fetch utilities
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Health check
export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => fetchAPI('/health'),
    refetchInterval: 30000, // Check every 30s
  });
}

// Projects
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetchAPI('/projects'),
  });
}

export function useProject(projectId: string | null) {
  return useQuery<ProjectWithFiles>({
    queryKey: ['projects', projectId],
    queryFn: () => fetchAPI(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectCreate>({
    mutationFn: (data) => fetchAPI('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// Files
export function useFileContent(projectId: string, filePath: string) {
  return useQuery<{ path: string; content: string }>({
    queryKey: ['files', projectId, filePath],
    queryFn: () => fetchAPI(`/projects/${projectId}/files/${filePath}`),
    enabled: !!projectId && !!filePath,
  });
}

export function useUpsertFile() {
  const queryClient = useQueryClient();

  return useMutation<FileRecord, Error, { projectId: string; data: FileUpsert }>({
    mutationFn: ({ projectId, data }) =>
      fetchAPI(`/projects/${projectId}/files`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['files', variables.projectId] });
    },
  });
}

// Generation
export function useGenerate() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, GenerateRequest>({
    mutationFn: (data) => fetchAPI('/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] });
    },
  });
}

// Download
export function getDownloadUrl(projectId: string): string {
  return `${API_BASE_URL}/projects/${projectId}/zip`;
}

