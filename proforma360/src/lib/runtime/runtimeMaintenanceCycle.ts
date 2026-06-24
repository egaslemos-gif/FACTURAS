import { dbClient } from "../db/client";

export type MaintenanceUrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export class RuntimeMaintenanceCycle {
  private static isRunning = false;
  private static lastRun = 0;
  private static consecutiveCycles = 0;

  // Budget Constants
  private static readonly MAX_MAINTENANCE_DURATION_MS = 50;
  private static readonly MAX_CONSECUTIVE_MAINTENANCE_CYCLES = 3;
  private static readonly COOLDOWN_BETWEEN_CYCLES_MS = 5000;

  /**
   * Lazily triggers the maintenance cycle if conditions are met.
   * Uses micro-batches to avoid locking the UI thread and battery drain.
   */
  public static async triggerOpportunisticMaintenance(urgency: MaintenanceUrgencyLevel = "LOW"): Promise<void> {
    if (this.isRunning) return;

    const now = Date.now();
    const timeSinceLastRun = now - this.lastRun;

    // Cooldown check for consecutive cycles
    if (this.consecutiveCycles >= this.MAX_CONSECUTIVE_MAINTENANCE_CYCLES) {
      if (timeSinceLastRun < this.COOLDOWN_BETWEEN_CYCLES_MS) {
        return; // Forced cooldown
      } else {
        this.consecutiveCycles = 0; // Reset after cooldown
      }
    }

    // Throttle low urgency maintenance to once per hour
    if (urgency === "LOW" && timeSinceLastRun < 60 * 60 * 1000) {
      return;
    }

    // Throttle medium urgency to once per 5 minutes
    if (urgency === "MEDIUM" && timeSinceLastRun < 5 * 60 * 1000) {
      return;
    }

    try {
      this.isRunning = true;
      this.lastRun = now;
      this.consecutiveCycles++;

      const startTime = performance.now();

      // 1. Compact Persistent Sync Queue (Micro-batch: delete max 50 ACKED rows)
      await this.compactSyncQueue();
      if (performance.now() - startTime > this.MAX_MAINTENANCE_DURATION_MS) return;

      // 2. Truncate Telemetry and Diagnostics (Micro-batch)
      await this.truncateDiagnostics();
      if (performance.now() - startTime > this.MAX_MAINTENANCE_DURATION_MS) return;

      // 3. Rebuild Projections if critical
      if (urgency === "CRITICAL") {
        await this.emergencyCompaction();
      }

    } catch (e) {
      console.warn("[RuntimeMaintenance] Cycle failed opportunistically:", e);
    } finally {
      this.isRunning = false;
    }
  }

  private static async compactSyncQueue() {
    // Delete up to 50 successfully synced items that are older than 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // SQLite doesn't directly support LIMIT in DELETE unless compiled with it, 
    // so we select IDs first then delete.
    const rows = await dbClient.query(`
      SELECT id FROM persistent_sync_queue 
      WHERE status = 'ACKED' AND created_at < ? 
      LIMIT 50
    `, [sevenDaysAgo]);

    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      await dbClient.executeWrite(`
        DELETE FROM persistent_sync_queue 
        WHERE id IN (${placeholders})
      `, ids);
      console.log(`[RuntimeMaintenance] Compacted ${rows.length} stale sync queue items.`);
    }
  }

  private static async truncateDiagnostics() {
    // Keep only the latest 100 diagnostic logs
    const countRes = await dbClient.getOne(`SELECT COUNT(*) as count FROM runtime_diagnostics`);
    if (countRes && countRes.count > 150) {
      // Find the threshold timestamp
      const rows = await dbClient.query(`
        SELECT timestamp FROM runtime_diagnostics 
        ORDER BY timestamp DESC 
        LIMIT 1 OFFSET 100
      `);
      if (rows.length > 0) {
        const threshold = rows[0].timestamp;
        await dbClient.executeWrite(`DELETE FROM runtime_diagnostics WHERE timestamp <= ?`, [threshold]);
        console.log(`[RuntimeMaintenance] Truncated runtime_diagnostics to latest 100 entries.`);
      }
    }
  }

  private static async emergencyCompaction() {
    console.warn("[RuntimeMaintenance] Executing CRITICAL emergency compaction!");
    // In extreme pressure (CRITICAL urgency), aggressively clean up
    // even non-ACKED items that have exceeded retries, etc.
    await dbClient.executeWrite(`
      DELETE FROM persistent_sync_queue 
      WHERE status = 'DEAD_LETTER' OR status = 'ORPHANED'
    `);
    
    // Clear out cache projections if they exist (future feature boundary)
  }
}
