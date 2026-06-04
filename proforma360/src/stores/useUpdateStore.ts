import { create } from 'zustand';

interface UpdateState {
  updateAvailable: boolean;
  isUpdating: boolean;
  setUpdateAvailable: (available: boolean) => void;
  setIsUpdating: (updating: boolean) => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  updateAvailable: false,
  isUpdating: false,
  setUpdateAvailable: (available) => set({ updateAvailable: available }),
  setIsUpdating: (updating) => set({ isUpdating: updating }),
}));
