'use client';

import { Sandpack } from '@codesandbox/sandpack-react';
import { FileRecord } from '../../../../../../packages/shared/src/schemas';
import { useEffect, useState } from 'react';

interface PreviewProps {
  projectId: string;
  files: FileRecord[];
}

export function Preview({ projectId, files }: PreviewProps) {
  const [sandpackFiles, setSandpackFiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      setIsLoading(true);
      const filesMap: Record<string, string> = {};

      // Fetch content for each file
      for (const file of files) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/${projectId}/files/${file.path}`
          );
          const data = await response.json();
          filesMap[`/${file.path}`] = data.content;
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
  }, [projectId, files]);

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

  return (
    <div className="h-full">
      <Sandpack
        template="static"
        files={sandpackFiles}
        options={{
          showNavigator: true,
          showTabs: false,
          showLineNumbers: true,
          editorHeight: '100%',
          editorWidthPercentage: 0,
        }}
        theme="dark"
      />
    </div>
  );
}

