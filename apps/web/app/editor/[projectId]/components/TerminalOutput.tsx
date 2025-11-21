'use client';

import { useEffect, useRef, useState } from 'react';
import { createDevServerWebSocket, type WebSocketMessage } from '../../../../lib/api';

interface TerminalOutputProps {
  projectId: string;
  isVisible: boolean;
}

interface LogLine {
  text: string;
  isStderr: boolean;
  timestamp: Date;
}

export function TerminalOutput({ projectId, isVisible }: TerminalOutputProps) {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Always connect WebSocket, even if not visible, to capture startup logs
  useEffect(() => {
    if (!projectId) {
      return;
    }

    const ws = createDevServerWebSocket(
      projectId,
      (message: WebSocketMessage) => {
        if (message.type === 'output') {
          setLogs((prev) => [
            ...prev,
            {
              text: message.line || '',
              isStderr: message.is_stderr || false,
              timestamp: new Date(),
            },
          ]);
        } else if (message.type === 'status') {
          setIsConnected(true);
        } else if (message.type === 'error') {
          setLogs((prev) => [
            ...prev,
            {
              text: `Error: ${message.message || 'Unknown error'}`,
              isStderr: true,
              timestamp: new Date(),
            },
          ]);
        }
      },
      (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      },
      () => {
        setIsConnected(false);
      }
    );

    wsRef.current = ws;
    setIsConnected(ws?.readyState === WebSocket.OPEN);

    return () => {
      if (ws) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [projectId]); // Always connect, not just when visible

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs font-semibold">Terminal Output</span>
        </div>
        <button
          onClick={() => setLogs([])}
          className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Logs */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-xs">No output yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`${
                log.isStderr ? 'text-red-400' : 'text-gray-300'
              } whitespace-pre-wrap break-words`}
            >
              {log.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

