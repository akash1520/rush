'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDevServerStatus, useStartDevServer } from '../../../../lib/api';

interface PreviewProps {
  projectId: string;
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

/**
 * Preview component - Shows ONLY the AI-generated Next.js app running on dev server.
 * This is the single source of truth for preview - no duplicates, no code views, just the app.
 */
export function Preview({ projectId, iframeRef: externalIframeRef }: PreviewProps) {
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { data: status } = useDevServerStatus(projectId);
  const startDevServer = useStartDevServer();
  const hasTriedStartRef = useRef(false);
  const userStoppedRef = useRef(false);
  const isInitialMountRef = useRef(true);

  // Track user-initiated stops (from DevServerStatus component)
  useEffect(() => {
    const handleUserStop = () => {
      userStoppedRef.current = true;
    };
    window.addEventListener('dev-server-user-stop', handleUserStop);
    return () => window.removeEventListener('dev-server-user-stop', handleUserStop);
  }, []);

  // Clear user stopped flag when server starts running
  useEffect(() => {
    if (status?.status === 'running') {
      userStoppedRef.current = false;
    }
  }, [status?.status]);

  // Auto-start dev server only on initial mount if server was never started
  // Do NOT auto-start if user explicitly stopped it
  useEffect(() => {
    if (isInitialMountRef.current && projectId && status?.status === 'stopped' && !userStoppedRef.current && !hasTriedStartRef.current && !startDevServer.isPending) {
      hasTriedStartRef.current = true;
      startDevServer.mutate(projectId);
    }
    isInitialMountRef.current = false;

    // Reset the ref if server actually starts or errors
    if (status?.status === 'running' || status?.status === 'error') {
      hasTriedStartRef.current = false;
    }
  }, [projectId, status?.status, startDevServer.isPending]);

  // Update iframe src when server is ready
  useEffect(() => {
    if (status?.status === 'running' && status.port) {
      setIsLoading(false);
      setError(null);
    } else if (status?.status === 'starting') {
      setIsLoading(true);
      setError(null);
    } else if (status?.status === 'error') {
      setIsLoading(false);
      setError(status.error_message || 'Failed to start dev server');
    } else if (status?.status === 'stopped') {
      setIsLoading(true);
      setError(null);
    }
  }, [status]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load preview');
  };

  // Wait for server to be ready before showing iframe
  useEffect(() => {
    if (status?.status === 'running' && status.port) {
      // Wait 3 seconds for Next.js to compile and start
      setIsReady(false);
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [status?.status, status?.port]);

  // Show loading state
  if (isLoading || status?.status === 'starting') {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">
            {status?.status === 'starting' ? 'Starting dev server...' : 'Loading preview...'}
          </p>
          {status?.status === 'starting' && (
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error || status?.status === 'error') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 font-semibold mb-2">Preview Error</p>
          <p className="text-sm text-gray-500">
            {error || status?.error_message || 'Failed to start dev server'}
          </p>
          <button
            onClick={() => startDevServer.mutate(projectId)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show stopped state
  if (status?.status === 'stopped') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-gray-600 font-semibold mb-2">Dev Server Stopped</p>
          <p className="text-sm text-gray-500 mb-4">
            Start the dev server to see your AI-generated app
          </p>
          <button
            onClick={() => startDevServer.mutate(projectId)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Start Dev Server
          </button>
        </div>
      </div>
    );
  }

  // Show preview iframe - THIS IS THE ONLY PREVIEW
  // It shows the AI-generated Next.js app running on the dev server
  if (status?.status === 'running' && status.port) {
    const previewUrl = `http://localhost:${status.port}`;

    if (!isReady) {
      return (
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Waiting for server to be ready...</p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title="AI Generated App Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">👀</div>
        <p className="text-gray-600">No preview available</p>
        <p className="text-sm text-gray-500 mt-2">
          Generate some code using the AI chat to see the preview
        </p>
      </div>
    </div>
  );
}
