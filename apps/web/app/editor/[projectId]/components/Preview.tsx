'use client';

import { Sandpack } from '@codesandbox/sandpack-react';
import { FileRecord } from '../../../../../../packages/shared/src/schemas';
import { useEffect, useState } from 'react';

interface PreviewProps {
  projectId: string;
  files: FileRecord[];
  localFileContents?: Record<string, string>; // Optional: preview unsaved changes
}

interface SandpackFile {
  code: string;
  hidden?: boolean;
  active?: boolean;
  readOnly?: boolean;
}

export function Preview({ projectId, files, localFileContents }: PreviewProps) {
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, SandpackFile>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      const filesMap: Record<string, SandpackFile> = {};

      // Fetch content for each file
      for (const file of files) {
        try {
          // Check if we have local unsaved content
          const localPath = file.path;
          if (localFileContents && localFileContents[localPath]) {
            // Use local content if available
            filesMap[`/${file.path}`] = {
              code: localFileContents[localPath],
              hidden: false,
            };
          } else {
            // Otherwise fetch from API
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/${projectId}/files/${file.path}`
            );
            const data = await response.json();

            // Sandpack expects files in this format
            filesMap[`/${file.path}`] = {
              code: data.content,
              hidden: false,
            };
          }
        } catch (error) {
          console.error(`Failed to load ${file.path}:`, error);
        }
      }

      setSandpackFiles(filesMap);
      setIsLoading(false);
    };

    if (files.length > 0) {
      loadFiles();
    } else {
      setSandpackFiles({});
      setIsLoading(false);
    }
  }, [projectId, files, localFileContents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">👀</div>
          <p className="text-gray-600">No files to preview</p>
          <p className="text-sm text-gray-500 mt-2">
            Generate some code using the AI chat to see the preview
          </p>
        </div>
      </div>
    );
  }

  // Find index.html or first HTML file to set as active
  const htmlFile = Object.keys(sandpackFiles).find(path =>
    path.includes('index.html') || path.endsWith('.html')
  ) || Object.keys(sandpackFiles)[0];

  return (
    <div className="h-full w-full overflow-hidden">
      <div style={{ height: '100%', width: '100%' }}>
        <Sandpack
          template="static"
          files={sandpackFiles}
          options={{
            showNavigator: false,
            showTabs: false,
            showLineNumbers: false,
            editorHeight: '100vh',
            editorWidthPercentage: 0,
          }}
          theme="dark"
        />
      </div>
    </div>
  );
}

