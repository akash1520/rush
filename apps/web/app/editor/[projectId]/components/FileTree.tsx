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
    <div className="bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark h-full overflow-auto">
      <div className="p-3 border-b border-border-light dark:border-border-dark">
        <h3 className="font-semibold text-sm text-fg-light dark:text-fg-dark">Files</h3>
      </div>

      <div className="p-2">
        {directories.map((dir) => (
          <div key={dir} className="mb-2">
            {dir && (
              <div className="text-xs font-medium text-muted-light dark:text-muted-dark px-2 py-1">
                📁 {dir}
              </div>
            )}
            {fileTree[dir].map((file) => (
              <button
                key={file.id}
                onClick={() => onFileSelect(file.path)}
                className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-all flex items-center gap-2 ${
                  activeFile === file.path
                    ? 'bg-primary-light dark:bg-primary-dark text-white dark:text-black'
                    : 'text-fg-light dark:text-fg-dark hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <span>{getFileIcon(file.fileName)}</span>
                <span className="truncate">{file.fileName}</span>
              </button>
            ))}
          </div>
        ))}

        {files.length === 0 && (
          <div className="text-center py-8 text-muted-light dark:text-muted-dark text-sm">
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

