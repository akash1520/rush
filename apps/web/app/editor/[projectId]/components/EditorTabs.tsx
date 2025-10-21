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
    <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab}
          className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 min-w-[120px] ${
            activeTab === tab
              ? 'bg-gray-900 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
          }`}
        >
          <button
            onClick={() => onTabSelect(tab)}
            className="flex-1 text-left text-sm truncate"
          >
            {getFileName(tab)}
            {unsavedChanges[tab] && <span className="text-blue-400 ml-1">●</span>}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab);
            }}
            className="text-gray-500 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}

      {tabs.length === 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          No files open
        </div>
      )}
    </div>
  );
}

