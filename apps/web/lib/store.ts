import { create } from 'zustand';
import type { Project, FileRecord } from '../../../packages/shared/src/schemas';

interface EditorState {
  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Files
  files: FileRecord[];
  setFiles: (files: FileRecord[]) => void;

  // Active file in editor
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;

  // Open tabs
  openTabs: string[];
  addTab: (path: string) => void;
  removeTab: (path: string) => void;

  // File content cache (path -> content)
  fileContents: Record<string, string>;
  setFileContent: (path: string, content: string) => void;

  // Unsaved changes
  unsavedChanges: Record<string, boolean>;
  markAsUnsaved: (path: string) => void;
  markAsSaved: (path: string) => void;

  // UI state
  isChatPanelOpen: boolean;
  setIsChatPanelOpen: (open: boolean) => void;

  // Reset state
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // Files
  files: [],
  setFiles: (files) => set({ files }),

  // Active file
  activeFilePath: null,
  setActiveFilePath: (path) => set({ activeFilePath: path }),

  // Tabs
  openTabs: [],
  addTab: (path) => set((state) => {
    if (!state.openTabs.includes(path)) {
      return { openTabs: [...state.openTabs, path], activeFilePath: path };
    }
    return { activeFilePath: path };
  }),
  removeTab: (path) => set((state) => {
    const newTabs = state.openTabs.filter((p) => p !== path);
    const newActiveFile = newTabs.length > 0
      ? (state.activeFilePath === path ? newTabs[newTabs.length - 1] : state.activeFilePath)
      : null;
    return { openTabs: newTabs, activeFilePath: newActiveFile };
  }),

  // File contents
  fileContents: {},
  setFileContent: (path, content) => set((state) => ({
    fileContents: { ...state.fileContents, [path]: content }
  })),

  // Unsaved changes
  unsavedChanges: {},
  markAsUnsaved: (path) => set((state) => ({
    unsavedChanges: { ...state.unsavedChanges, [path]: true }
  })),
  markAsSaved: (path) => set((state) => ({
    unsavedChanges: { ...state.unsavedChanges, [path]: false }
  })),

  // UI state
  isChatPanelOpen: true,
  setIsChatPanelOpen: (open) => set({ isChatPanelOpen: open }),

  // Reset
  reset: () => set({
    currentProject: null,
    files: [],
    activeFilePath: null,
    openTabs: [],
    fileContents: {},
    unsavedChanges: {},
    isChatPanelOpen: true,
  }),
}));

