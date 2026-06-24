import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncState {
  hasUnsyncedChanges: boolean;
  lastSyncDate: string | null;
  setHasUnsyncedChanges: (value: boolean) => void;
  setLastSyncDate: (date: string) => void;
}

import { createJSONStorage } from 'zustand/middleware';
import { namespaceStorage } from '@/lib/runtime/namespaceStorage';

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      hasUnsyncedChanges: false,
      lastSyncDate: null,
      setHasUnsyncedChanges: (value) => set({ hasUnsyncedChanges: value }),
      setLastSyncDate: (date) => set({ lastSyncDate: date }),
    }),
    {
      name: 'proforma360-sync-store',
      storage: createJSONStorage(() => namespaceStorage),
    }
  )
);
