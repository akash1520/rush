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

// Dev Server Types
export interface DevServerStatus {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  port?: number;
  pid?: number;
  error_message?: string;
}

export interface WebSocketMessage {
  type: 'status' | 'output' | 'error' | 'pong';
  status?: string;
  port?: number;
  pid?: number;
  line?: string;
  is_stderr?: boolean;
  message?: string;
}

// Dev Server API
export function useDevServerStatus(projectId: string | null) {
  return useQuery<DevServerStatus>({
    queryKey: ['dev-server', projectId],
    queryFn: () => fetchAPI<DevServerStatus>(`/projects/${projectId}/dev-server/status`),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Poll more frequently if server is starting
      if (data?.status === 'starting') {
        return 1000; // 1 second
      }
      return 5000; // 5 seconds otherwise
    },
  });
}

export function useStartDevServer() {
  const queryClient = useQueryClient();

  return useMutation<DevServerStatus, Error, string>({
    mutationFn: (projectId) =>
      fetchAPI<DevServerStatus>(`/projects/${projectId}/dev-server/start`, {
        method: 'POST',
      }),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['dev-server', projectId] });
    },
  });
}

export function useStopDevServer() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (projectId) =>
      fetchAPI(`/projects/${projectId}/dev-server/stop`, {
        method: 'POST',
      }),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['dev-server', projectId] });
    },
  });
}

// WebSocket client for dev server logs
export function createDevServerWebSocket(
  projectId: string,
  onMessage: (message: WebSocketMessage) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const wsUrl = API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://');
  const ws = new WebSocket(`${wsUrl}/projects/${projectId}/dev-server/ws`);

  ws.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    if (onError) {
      onError(error);
    }
  };

  ws.onclose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Send ping every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  return ws;
}

// Chat History Types
export interface ChatMessage {
  id: string;
  projectId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Chat History API
export function useChatMessages(projectId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', projectId],
    queryFn: () => fetchAPI<ChatMessage[]>(`/projects/${projectId}/chat/messages`),
    enabled: !!projectId,
  });
}

export function useCreateChatMessage() {
  const queryClient = useQueryClient();

  return useMutation<ChatMessage, Error, { projectId: string; role: 'user' | 'assistant'; content: string }>({
    mutationFn: ({ projectId, role, content }) =>
      fetchAPI<ChatMessage>(`/projects/${projectId}/chat/messages`, {
        method: 'POST',
        body: JSON.stringify({ role, content }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.projectId] });
    },
  });
}

export function useClearChatMessages() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (projectId) =>
      fetchAPI(`/projects/${projectId}/chat/messages`, {
        method: 'DELETE',
      }),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', projectId] });
    },
  });
}

