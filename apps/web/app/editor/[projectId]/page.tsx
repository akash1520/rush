'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProject, useFileContent, useUpsertFile, getDownloadUrl } from '../../../lib/api';
import { useEditorStore } from '../../../lib/store';
import { FileTree } from './components/FileTree';
import { EditorTabs } from './components/EditorTabs';
import { CodeEditor } from './components/CodeEditor';
import { ChatPanel } from './components/ChatPanel';
import { Preview } from './components/Preview';

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { data: project, isLoading, refetch } = useProject(projectId);
  const upsertFile = useUpsertFile();

  const {
    activeFilePath,
    openTabs,
    fileContents,
    unsavedChanges,
    setCurrentProject,
    setFiles,
    addTab,
    removeTab,
    setActiveFilePath,
    setFileContent,
    markAsUnsaved,
    markAsSaved,
    isChatPanelOpen,
    setIsChatPanelOpen,
  } = useEditorStore();

  const [showPreview, setShowPreview] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  // Function to refresh preview
  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  // Update store when project loads
  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      setFiles(project.files || []);
    }
  }, [project, setCurrentProject, setFiles]);

  // Load active file content
  const { data: fileData } = useFileContent(
    projectId,
    activeFilePath || ''
  );

  useEffect(() => {
    if (fileData && activeFilePath && !fileContents[activeFilePath]) {
      setFileContent(activeFilePath, fileData.content);
    }
  }, [fileData, activeFilePath, fileContents, setFileContent]);

  const handleFileSelect = (path: string) => {
    addTab(path);
  };

  const handleEditorChange = (value: string) => {
    if (activeFilePath) {
      setFileContent(activeFilePath, value);
      markAsUnsaved(activeFilePath);
    }
  };

  const handleSave = async () => {
    if (!activeFilePath || !unsavedChanges[activeFilePath]) return;

    try {
      await upsertFile.mutateAsync({
        projectId,
        data: {
          path: activeFilePath,
          content: fileContents[activeFilePath],
        },
      });
      markAsSaved(activeFilePath);
      refreshPreview(); // Refresh preview after save
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
    }
  };

  const handleSaveAll = async () => {
    const unsavedFiles = Object.keys(unsavedChanges).filter(
      (path) => unsavedChanges[path]
    );

    for (const path of unsavedFiles) {
      try {
        await upsertFile.mutateAsync({
          projectId,
          data: {
            path,
            content: fileContents[path],
          },
        });
        markAsSaved(path);
      } catch (error) {
        console.error(`Failed to save ${path}:`, error);
      }
    }

    if (unsavedFiles.length > 0) {
      refreshPreview(); // Refresh preview after saving all
    }
  };

  const handleDownload = () => {
    window.open(getDownloadUrl(projectId), '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const hasUnsavedChanges = Object.values(unsavedChanges).some((changed) => changed);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold">{project.name}</h1>
          {hasUnsavedChanges && (
            <span className="text-sm text-orange-600">● Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {showPreview ? '👁️ Preview' : '👁️‍🗨️ Show Preview'}
          </button>
          <button
            onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {isChatPanelOpen ? '💬 Chat' : '💬 Show Chat'}
          </button>
          <button
            onClick={handleSave}
            disabled={!activeFilePath || !unsavedChanges[activeFilePath] || upsertFile.isPending}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || upsertFile.isPending}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save All
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            ⬇️ Download
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-r border-gray-200">
          <FileTree
            files={project.files || []}
            activeFile={activeFilePath}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <EditorTabs
            tabs={openTabs}
            activeTab={activeFilePath}
            onTabSelect={setActiveFilePath}
            onTabClose={removeTab}
            unsavedChanges={unsavedChanges}
          />

          <div className="flex-1">
            {activeFilePath && fileContents[activeFilePath] !== undefined ? (
              <CodeEditor
                value={fileContents[activeFilePath]}
                onChange={handleEditorChange}
                language={activeFilePath.split('.').pop() || 'html'}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/3 border-l border-gray-200">
            <Preview
              key={previewKey}
              projectId={projectId}
              files={project.files || []}
            />
          </div>
        )}

        {/* Chat Panel */}
        {isChatPanelOpen && (
          <div className="w-96">
            <ChatPanel
              projectId={projectId}
              onGenerated={async () => {
                await refetch();
                // Small delay to ensure files are saved
                setTimeout(() => {
                  refreshPreview();
                }, 500);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

