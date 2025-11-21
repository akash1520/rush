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
        return 'bg-primary-light dark:bg-primary-dark';
      case 'starting':
        return 'bg-primary-light/50 dark:bg-primary-dark/50';
      case 'stopping':
        return 'bg-primary-light/50 dark:bg-primary-dark/50';
      case 'error':
        return 'bg-primary-light dark:bg-primary-dark';
      default:
        return 'bg-gray-400 dark:bg-gray-600';
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
      <div className="px-4 py-2 bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark flex items-center gap-2">
        <div className="w-3 h-3 border border-border-light dark:border-border-dark bg-fg-light dark:bg-fg-dark animate-pulse rounded-full" />
        <span className="text-xs text-fg-light dark:text-fg-dark font-medium">Loading status...</span>
      </div>
    );
  }

  const isRunning = status?.status === 'running';
  const isStarting = status?.status === 'starting';
  const isStopping = status?.status === 'stopping';
  const canStart = !isRunning && !isStarting && !isStopping;
  const canStop = isRunning && !isStopping;

  return (
    <div className="px-4 py-2 bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 border border-border-light dark:border-border-dark ${getStatusColor(status?.status)} rounded-full`} />
          <span className="text-xs font-medium text-fg-light dark:text-fg-dark">
            {getStatusText(status?.status)}
          </span>
        </div>
        {status?.port && (
          <span className="text-xs text-muted-light dark:text-muted-dark">
            Port: {status.port}
          </span>
        )}
        {status?.error_message && (
          <span className="text-xs text-primary-light dark:text-primary-dark font-medium">
            {status.error_message}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleStart}
          disabled={!canStart || startDevServer.isPending || isActionPending}
          className="text-xs px-3 py-1 border border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {startDevServer.isPending || isActionPending ? 'Starting...' : 'Start'}
        </button>
        <button
          onClick={handleStop}
          disabled={!canStop || stopDevServer.isPending || isActionPending}
          className="text-xs px-3 py-1 border border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {stopDevServer.isPending || isActionPending ? 'Stopping...' : 'Stop'}
        </button>
      </div>
    </div>
  );
}

