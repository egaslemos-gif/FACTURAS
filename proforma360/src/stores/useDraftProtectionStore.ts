import { create } from 'zustand';

interface DraftProtectionState {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

export const useDraftProtectionStore = create<DraftProtectionState>((set) => ({
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
}));
