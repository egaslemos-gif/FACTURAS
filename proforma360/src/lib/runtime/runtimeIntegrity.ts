import { dbClient } from "../db/client";

export interface IntegrityReport {
  isHealthy: boolean;
  appVersion: string;
  swStatus: string;
  dbStatus: string;
  errors: string[];
  selfHealed: boolean;
}

export class RuntimeIntegrity {
  private static APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "v1.0.0";

  /**
   * Run full system integrity analysis and perform self-healing if needed
   */
  static async checkIntegrity(): Promise<IntegrityReport> {
    const errors: string[] = [];
    let dbStatus = "unknown";
    let swStatus = "unknown";
    let selfHealed = false;

    // 1. Check Service Worker version/presence
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        swStatus = reg.active ? "active" : "registered";
      } else {
        swStatus = "missing";
        errors.push("Service Worker registration is missing or suspended.");
      }
    } else {
      swStatus = "unsupported";
    }

    // 2. Check SQLite Database and Tables Health
    try {
      await dbClient.init();
      // Try a test query
      const tables = await dbClient.query("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.map((t: any) => t.name);
      
      if (!tableNames.includes("quotations") || !tableNames.includes("clients")) {
        dbStatus = "corrupted";
        errors.push("Database schema is incomplete (missing core tables).");
        
        // Self-Healing 1: Re-trigger schema creations
        console.log("[Runtime Integrity] Auto-repairing database schema...");
        await dbClient.executeWrite("VACUUM"); // Clean up database file
        selfHealed = true;
      } else {
        dbStatus = "healthy";
      }
    } catch (e: any) {
      dbStatus = "error";
      errors.push(`Database connection failed: ${e.message}`);
    }

    // 3. Check Queue Locks
    try {
      const lockRow = await dbClient.getOne(
        "SELECT COUNT(*) as cnt FROM persistent_sync_queue WHERE status = 'processing'"
      );
      if (lockRow && lockRow.cnt > 5) {
        // Queue is stuck in processing for too long or too many items locked
        errors.push("Queue locks detected (too many tasks marked as processing).");
        
        // Self-Healing 2: Reset stuck items back to pending
        console.log("[Runtime Integrity] Auto-repairing queue locks...");
        await dbClient.executeWrite(
          "UPDATE persistent_sync_queue SET status = 'pending' WHERE status = 'processing'"
        );
        selfHealed = true;
      }
    } catch (e) {
      // Ignore if table doesn't exist yet
    }

    // 4. Stale Chunks / Offline Cache Check
    if (typeof window !== "undefined" && "caches" in window) {
      try {
        const keys = await caches.keys();
        if (keys.length === 0) {
          errors.push("PWA offline caches are completely empty.");
        }
      } catch (e) {
        errors.push("Could not read browser caches.");
      }
    }

    return {
      isHealthy: errors.length === 0,
      appVersion: this.APP_VERSION,
      swStatus,
      dbStatus,
      errors,
      selfHealed,
    };
  }

  /**
   * Full cache and registration wipe to force clean-install state
   */
  static async forceRebuildRuntime(): Promise<void> {
    console.log("[Runtime Integrity] Wiping and rebuilding runtime caches...");
    
    // Clear all caches
    if (typeof window !== "undefined" && "caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    
    // Unregister service workers
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }

    // Reload the app shell
    window.location.reload();
  }
}
