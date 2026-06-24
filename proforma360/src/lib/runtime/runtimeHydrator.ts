import { dbClient } from "../db/client";

export type HydrationPhase = "BOOTING" | "DB_READY" | "CORE_READY" | "UI_READY" | "FULLY_OPERATIONAL";

export class RuntimeHydrator {
  private static phase: HydrationPhase = "BOOTING";
  private static listeners: ((phase: HydrationPhase) => void)[] = [];

  static getPhase(): HydrationPhase {
    return this.phase;
  }

  static subscribe(listener: (phase: HydrationPhase) => void): () => void {
    this.listeners.push(listener);
    // Call immediately with current phase
    listener(this.phase);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static setPhase(newPhase: HydrationPhase) {
    this.phase = newPhase;
    console.log(`[Runtime Hydrator] Phase transitioned to: ${newPhase}`);
    this.listeners.forEach(l => l(newPhase));
  }

  /**
   * Safe initialization and staged hydration of the offline runtime
   */
  static async start(): Promise<void> {
    try {
      this.setPhase("BOOTING");

      // 1. Request persistent storage to prevent browser eviction
      if (typeof window !== "undefined" && navigator.storage && navigator.storage.persist) {
        try {
          const persisted = await navigator.storage.persist();
          console.log(`[Runtime Hydrator] Persistent storage status: ${persisted}`);
        } catch (e) {
          console.warn("[Runtime Hydrator] Storage persist request failed:", e);
        }
      }

      // 2. Initialize database
      await dbClient.init();
      this.setPhase("DB_READY");

      // 3. Load core/company settings
      // Simulating loading essential settings
      await new Promise(r => setTimeout(r, 200));
      this.setPhase("CORE_READY");

      // 4. Rehydrate Zustand stores
      // In Proforma360, this resolves when clients, products, and quotation stores load data from SQLite
      this.setPhase("UI_READY");

      // 5. Trigger final background queue tasks and mark ready
      const { PersistentSyncQueue } = await import("../sync/persistentSyncQueue");
      if (typeof window !== "undefined" && navigator.onLine) {
        // Run sync queue in background
        PersistentSyncQueue.processQueue().catch(err => {
          console.error("[Runtime Hydrator] Failed processing queue on startup:", err);
        });
      }

      this.setPhase("FULLY_OPERATIONAL");
    } catch (error) {
      console.error("[Runtime Hydrator] Fatal error during hydration:", error);
      throw error;
    }
  }
}
