import { dbClient } from "../db/client";

export interface DiagnosticLog {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export class RuntimeDiagnostics {
  /**
   * Records a diagnostics event to the local database
   */
  static async log(type: "BOOT" | "SYNC_FAIL" | "HYDRATION_FAIL" | "CACHE_INCONSISTENCY" | "RECOVERY" | "QUEUE_FAIL" | "CONFLICT", message: string): Promise<void> {
    const id = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `diag_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
    const now = new Date().toISOString();
    console.log(`[Diagnostics - ${type}] ${message}`);

    try {
      await dbClient.executeWrite(
        "INSERT INTO runtime_diagnostics (id, type, message, timestamp) VALUES (?, ?, ?, ?)",
        [id, type, message, now]
      );
    } catch (e) {
      console.error("[RuntimeDiagnostics] Failed to save log:", e);
    }
  }

  /**
   * Fetches the latest 50 logs from SQLite
   */
  static async getLogs(): Promise<DiagnosticLog[]> {
    try {
      const rows = await dbClient.query(
        "SELECT * FROM runtime_diagnostics ORDER BY timestamp DESC LIMIT 50"
      );
      return rows.map((r: any) => ({
        id: r.id,
        type: r.type,
        message: r.message,
        timestamp: r.timestamp
      }));
    } catch (e) {
      return [];
    }
  }
}
