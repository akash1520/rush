'use client';

interface EditorTabsProps {
  tabs: string[];
  activeTab: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
  unsavedChanges: Record<string, boolean>;
}

export function EditorTabs({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose,
  unsavedChanges
}: EditorTabsProps) {
  const getFileName = (path: string) => path.split('/').pop() || path;

  return (
    <div className="flex items-center bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab}
          className={`flex items-center gap-2 px-4 py-2 border-r border-border-light dark:border-border-dark min-w-[120px] ${
            activeTab === tab
              ? 'bg-primary-light/10 dark:bg-primary-dark/10 text-primary-light dark:text-primary-dark border-b-2 border-b-primary-light dark:border-b-primary-dark'
              : 'bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark opacity-70 hover:opacity-100'
          }`}
        >
          <button
            onClick={() => onTabSelect(tab)}
            className="flex-1 text-left text-xs font-medium truncate"
          >
            {getFileName(tab)}
            {unsavedChanges[tab] && <span className="text-primary-light dark:text-primary-dark ml-1">●</span>}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab);
            }}
            className="text-fg-light dark:text-fg-dark hover:text-primary-light dark:hover:text-primary-dark font-medium rounded"
          >
            ×
          </button>
        </div>
      ))}

      {tabs.length === 0 && (
        <div className="px-4 py-2 text-sm text-muted-light dark:text-muted-dark">
          No files open
        </div>
      )}
    </div>
  );
}

