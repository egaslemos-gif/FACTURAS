import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: number | null;
  setOnline: (status: boolean) => void;
  setChecking: (status: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isChecking: false,
  lastChecked: null,
  setOnline: (status) => set({ isOnline: status, lastChecked: Date.now() }),
  setChecking: (status) => set({ isChecking: status }),
}));
