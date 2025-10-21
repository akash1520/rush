'use client';

import { FileRecord } from '../../../../../../packages/shared/src/schemas';

interface FileTreeProps {
  files: FileRecord[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
}

export function FileTree({ files, activeFile, onFileSelect }: FileTreeProps) {
  // Group files by directory
  const fileTree = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    const fileName = parts[parts.length - 1];
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

    if (!acc[dir]) acc[dir] = [];
    acc[dir].push({ ...file, fileName });

    return acc;
  }, {} as Record<string, Array<FileRecord & { fileName: string }>>);

  const directories = Object.keys(fileTree).sort();

  return (
    <div className="bg-gray-900 text-gray-100 h-full overflow-auto">
      <div className="p-3 border-b border-gray-700">
        <h3 className="font-semibold text-sm uppercase tracking-wide">Files</h3>
      </div>

      <div className="p-2">
        {directories.map((dir) => (
          <div key={dir} className="mb-2">
            {dir && (
              <div className="text-xs font-semibold text-gray-400 px-2 py-1">
                📁 {dir}
              </div>
            )}
            {fileTree[dir].map((file) => (
              <button
                key={file.id}
                onClick={() => onFileSelect(file.path)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-800 transition-colors flex items-center gap-2 ${
                  activeFile === file.path ? 'bg-blue-600 text-white' : ''
                }`}
              >
                <span>{getFileIcon(file.fileName)}</span>
                <span className="truncate">{file.fileName}</span>
              </button>
            ))}
          </div>
        ))}

        {files.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No files yet. Use the chat to generate code!
          </div>
        )}
      </div>
    </div>
  );
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html': return '📄';
    case 'css': return '🎨';
    case 'js': return '📜';
    case 'json': return '📋';
    case 'md': return '📝';
    default: return '📄';
  }
}

