import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SyncState {
  hasUnsyncedChanges: boolean;
  lastSyncDate: string | null;
  lastAutoBackupAt: string | null;
  autoBackupEnabled: boolean;
  setHasUnsyncedChanges: (value: boolean) => void;
  setLastSyncDate: (date: string) => void;
  setLastAutoBackupAt: (date: string) => void;
  setAutoBackupEnabled: (value: boolean) => void;
}

import { createJSONStorage } from 'zustand/middleware';
import { namespaceStorage } from '@/lib/runtime/namespaceStorage';

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      hasUnsyncedChanges: false,
      lastSyncDate: null,
      lastAutoBackupAt: null,
      autoBackupEnabled: true,
      setHasUnsyncedChanges: (value) => set({ hasUnsyncedChanges: value }),
      setLastSyncDate: (date) => set({ lastSyncDate: date }),
      setLastAutoBackupAt: (date) => set({ lastAutoBackupAt: date }),
      setAutoBackupEnabled: (value) => set({ autoBackupEnabled: value }),
    }),
    {
      name: 'proforma360-sync-store',
      storage: createJSONStorage(() => namespaceStorage),
    }
  )
);
