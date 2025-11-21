'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import Link from 'next/link';
import { useProject, useFileContent, useUpsertFile, getDownloadUrl, useDevServerStatus } from '../../../lib/api';
import { useEditorStore } from '../../../lib/store';
import { FileTree } from './components/FileTree';
import { EditorTabs } from './components/EditorTabs';
import { CodeEditor } from './components/CodeEditor';
import { ChatPanel } from './components/ChatPanel';
import { Preview } from './components/Preview';
import { DevServerStatus } from './components/DevServerStatus';
import { TerminalOutput } from './components/TerminalOutput';
import { ConsoleLogs } from './components/ConsoleLogs';

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
  const [showTerminal, setShowTerminal] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const previewIframeRef = React.useRef<HTMLIFrameElement>(null);

  // Auto-show terminal when server is starting so user can see what's happening
  const { data: devServerStatus } = useDevServerStatus(projectId);
  useEffect(() => {
    if (devServerStatus?.status === 'starting') {
      setShowTerminal(true);
    }
  }, [devServerStatus?.status]);


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
      // Next.js HMR will automatically reload on file save
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
    // Next.js HMR will automatically reload on file save
  };

  const handleDownload = () => {
    window.open(getDownloadUrl(projectId), '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-center">
          <div className="inline-block animate-spin border-4 border-primary-light dark:border-primary-dark border-t-transparent w-8 h-8 mb-4 rounded-full"></div>
          <p className="text-fg-light dark:text-fg-dark">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-fg-light dark:text-fg-dark">Project not found</h1>
          <Link href="/dashboard" className="text-primary-light dark:text-primary-dark border border-primary-light dark:border-primary-dark px-4 py-2 inline-block rounded-lg hover:bg-primary-light/10 dark:hover:bg-primary-dark/10 transition-all">
            ← Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const hasUnsavedChanges = Object.values(unsavedChanges).some((changed) => changed);

  return (
    <div className="h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <header className="bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-fg-light dark:text-fg-dark border border-border-light dark:border-border-dark px-3 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-fg-light dark:text-fg-dark">{project.name}</h1>
          {hasUnsavedChanges && (
            <span className="text-sm font-medium text-primary-light dark:text-primary-dark">● Unsaved</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 text-xs font-medium border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            {showPreview ? '👁️ Preview' : '👁️‍🗨️ Show Preview'}
          </button>
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="px-3 py-1 text-xs font-medium border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            {showTerminal ? '💻 Terminal' : '💻 Show Terminal'}
          </button>
          <button
            onClick={() => setShowConsole(!showConsole)}
            className="px-3 py-1 text-xs font-medium border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            {showConsole ? '📝 Console' : '📝 Show Console'}
          </button>
          <button
            onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
            className="px-3 py-1 text-xs font-medium border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
          >
            {isChatPanelOpen ? '💬 Chat' : '💬 Show Chat'}
          </button>
          <button
            onClick={handleSave}
            disabled={!activeFilePath || !unsavedChanges[activeFilePath] || upsertFile.isPending}
            className="px-3 py-1 text-xs font-medium border border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
          <button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || upsertFile.isPending}
            className="px-3 py-1 text-xs font-medium border border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save All
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 text-xs font-medium border border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-white dark:text-black rounded-lg hover:bg-accent-light dark:hover:bg-accent-dark transition-all"
          >
            ⬇️ Download
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Tree */}
        <div className="w-64 border-r border-border-light dark:border-border-dark">
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
              <div className="h-full flex items-center justify-center bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark">
                <div className="text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p>Select a file to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel - Shows ONLY the AI-generated Next.js app */}
        {showPreview && (
          <div className="w-1/3 border-l border-border-light dark:border-border-dark flex flex-col">
            <DevServerStatus projectId={projectId} />
            {/* Main Preview - AI Generated App Only */}
            <div className="flex-1 overflow-hidden relative">
              <Preview projectId={projectId} iframeRef={previewIframeRef} />
            </div>
            {/* Terminal Output (optional, collapsible) */}
            {showTerminal && (
              <div className="h-64 border-t border-border-light dark:border-border-dark shrink-0">
                <TerminalOutput projectId={projectId} isVisible={showTerminal} />
              </div>
            )}
            {/* Console Logs (optional, collapsible) */}
            {showConsole && (
              <div className="h-64 border-t border-border-light dark:border-border-dark shrink-0">
                <ConsoleLogs iframeRef={previewIframeRef} isVisible={showConsole} />
              </div>
            )}
          </div>
        )}

        {/* Chat Panel */}
        {isChatPanelOpen && (
          <div className="w-96">
            <ChatPanel
              projectId={projectId}
              onGenerated={async () => {
                await refetch();
                // Next.js HMR will automatically reload on file changes
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

