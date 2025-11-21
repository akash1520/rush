'use client';

import { useState } from 'react';
import { useDevServerStatus, useStartDevServer, useStopDevServer } from '../../../../lib/api';

interface DevServerStatusProps {
  projectId: string;
}

export function DevServerStatus({ projectId }: DevServerStatusProps) {
  const { data: status, isLoading } = useDevServerStatus(projectId);
  const startDevServer = useStartDevServer();
  const stopDevServer = useStopDevServer();

  const [isActionPending, setIsActionPending] = useState(false);

  const handleStart = async () => {
    if (isActionPending || startDevServer.isPending) return;

    setIsActionPending(true);
    try {
      await startDevServer.mutateAsync(projectId);
    } catch (error) {
      console.error('Failed to start dev server:', error);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleStop = async () => {
    if (isActionPending || stopDevServer.isPending) return;

    setIsActionPending(true);
    try {
      // Emit event to notify Preview component that this is a user-initiated stop
      window.dispatchEvent(new CustomEvent('dev-server-user-stop'));
      await stopDevServer.mutateAsync(projectId);
    } catch (error) {
      console.error('Failed to stop dev server:', error);
    } finally {
      setIsActionPending(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'starting':
        return 'bg-yellow-500';
      case 'stopping':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'starting':
        return 'Starting...';
      case 'stopping':
        return 'Stopping...';
      case 'error':
        return 'Error';
      default:
        return 'Stopped';
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-xs text-gray-600">Loading status...</span>
      </div>
    );
  }

  const isRunning = status?.status === 'running';
  const isStarting = status?.status === 'starting';
  const isStopping = status?.status === 'stopping';
  const canStart = !isRunning && !isStarting && !isStopping;
  const canStop = isRunning && !isStopping;

  return (
    <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(status?.status)}`} />
          <span className="text-xs font-medium text-gray-700">
            {getStatusText(status?.status)}
          </span>
        </div>
        {status?.port && (
          <span className="text-xs text-gray-600">
            Port: {status.port}
          </span>
        )}
        {status?.error_message && (
          <span className="text-xs text-red-600">
            {status.error_message}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleStart}
          disabled={!canStart || startDevServer.isPending || isActionPending}
          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {startDevServer.isPending || isActionPending ? 'Starting...' : 'Start'}
        </button>
        <button
          onClick={handleStop}
          disabled={!canStop || stopDevServer.isPending || isActionPending}
          className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {stopDevServer.isPending || isActionPending ? 'Stopping...' : 'Stop'}
        </button>
      </div>
    </div>
  );
}

