'use client';

import { useEffect, useRef, useState } from 'react';

interface ConsoleLogsProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  isVisible: boolean;
}

interface ConsoleLog {
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
  args?: any[];
}

export function ConsoleLogs({ iframeRef, isVisible }: ConsoleLogsProps) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !iframeRef.current) {
      return;
    }

    const iframe = iframeRef.current;
    const iframeWindow = iframe.contentWindow;

    if (!iframeWindow) {
      return;
    }

    // Inject script to intercept console methods
    const script = `
      (function() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        const originalInfo = console.info;

        function sendLog(level, args) {
          window.parent.postMessage({
            type: 'console-log',
            level: level,
            message: args.map(arg => {
              if (typeof arg === 'object') {
                try {
                  return JSON.stringify(arg, null, 2);
                } catch (e) {
                  return String(arg);
                }
              }
              return String(arg);
            }).join(' '),
            args: args
          }, '*');
        }

        console.log = function(...args) {
          originalLog.apply(console, args);
          sendLog('log', args);
        };

        console.error = function(...args) {
          originalError.apply(console, args);
          sendLog('error', args);
        };

        console.warn = function(...args) {
          originalWarn.apply(console, args);
          sendLog('warn', args);
        };

        console.info = function(...args) {
          originalInfo.apply(console, args);
          sendLog('info', args);
        };
      })();
    `;

    // Wait for iframe to load
    const handleLoad = () => {
      try {
        if (iframeWindow.document) {
          const scriptElement = iframeWindow.document.createElement('script');
          scriptElement.textContent = script;
          iframeWindow.document.head.appendChild(scriptElement);
        }
      } catch (e) {
        // Cross-origin restrictions might prevent this
        console.warn('Could not inject console interceptor:', e);
      }
    };

    iframe.addEventListener('load', handleLoad);
    if (iframe.contentDocument?.readyState === 'complete') {
      handleLoad();
    }

    // Listen for console messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console-log') {
        setLogs((prev) => [
          ...prev,
          {
            level: event.data.level,
            message: event.data.message,
            timestamp: new Date(),
            args: event.data.args,
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      window.removeEventListener('message', handleMessage);
    };
  }, [iframeRef, isVisible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  const getLogIcon = (level: ConsoleLog['level']) => {
    switch (level) {
      case 'error':
        return '❌';
      case 'warn':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-semibold">Console Logs</span>
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
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {logs.length === 0 ? (
          <div className="text-gray-500 text-xs">No console logs yet...</div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`${getLogColor(log.level)} whitespace-pre-wrap break-words`}
            >
              <span className="mr-2">{getLogIcon(log.level)}</span>
              <span className="text-gray-500 text-xs mr-2">
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

