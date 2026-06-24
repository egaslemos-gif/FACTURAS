import { create } from "zustand";

export interface UsageSnapshot {
  proformasCount: number;
  clientsCount: number;
  lastUpdated: number; // Unix timestamp
}

export interface UsageMeteringState {
  snapshot: UsageSnapshot;
  // Called during initial hydration to load the true DB count
  hydrateSnapshot: (proformas: number, clients: number) => void;
  // Called by mutation handlers to incrementally update the snapshot
  incrementUsage: (type: "PROFORMA" | "CLIENT", amount?: number) => void;
  decrementUsage: (type: "PROFORMA" | "CLIENT", amount?: number) => void;
}

/**
 * Global reactive store for Usage Metering.
 * Prevents running `SELECT COUNT(*)` on every render or reactive hook.
 * The Database / Journal layer is responsible for incrementing/decrementing this.
 */
export const useUsageMetering = create<UsageMeteringState>((set) => ({
  snapshot: {
    proformasCount: 0,
    clientsCount: 0,
    lastUpdated: Date.now(),
  },

  hydrateSnapshot: (proformasCount, clientsCount) => set({
    snapshot: {
      proformasCount,
      clientsCount,
      lastUpdated: Date.now(),
    }
  }),

  incrementUsage: (type, amount = 1) => set((state) => ({
    snapshot: {
      ...state.snapshot,
      proformasCount: type === "PROFORMA" ? state.snapshot.proformasCount + amount : state.snapshot.proformasCount,
      clientsCount: type === "CLIENT" ? state.snapshot.clientsCount + amount : state.snapshot.clientsCount,
      lastUpdated: Date.now(),
    }
  })),

  decrementUsage: (type, amount = 1) => set((state) => ({
    snapshot: {
      ...state.snapshot,
      proformasCount: type === "PROFORMA" ? Math.max(0, state.snapshot.proformasCount - amount) : state.snapshot.proformasCount,
      clientsCount: type === "CLIENT" ? Math.max(0, state.snapshot.clientsCount - amount) : state.snapshot.clientsCount,
      lastUpdated: Date.now(),
    }
  })),
}));

/**
 * Pure helper to read current usage snapshot synchronously
 */
export function getCurrentUsage(type: "PROFORMA" | "CLIENT"): number {
  const { snapshot } = useUsageMetering.getState();
  return type === "PROFORMA" ? snapshot.proformasCount : snapshot.clientsCount;
}
