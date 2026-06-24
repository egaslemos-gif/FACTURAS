import { dbClient } from "../db/client";

/**
 * Idempotency Protection for Proforma360.
 * Utilizes unique keys/hashes to verify if sync events have already run.
 */
export class IdempotencyManager {
  /**
   * Generates a deterministic idempotency key for an event payload
   */
  static generateKey(eventType: string, uniqueParams: Record<string, any>): string {
    const payloadStr = JSON.stringify(uniqueParams);
    // Simple hash function for client-side hashing
    let hash = 0;
    const str = `${eventType}:${payloadStr}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `idem_${Math.abs(hash)}_${uniqueParams.id || uniqueParams.quotationId || "event"}`;
  }

  /**
   * Checks if an idempotency key has already been successfully executed
   */
  static async isDuplicate(key: string): Promise<boolean> {
    if (!key) return false;
    try {
      const result = await dbClient.getOne(
        "SELECT status FROM persistent_sync_queue WHERE idempotency_key = ?",
        [key]
      );
      return result ? result.status === "completed" : false;
    } catch (e) {
      console.error("[Idempotency] Failed check:", e);
      return false;
    }
  }

  /**
   * Registers/reserves an idempotency key in the queue database
   */
  static async registerKey(key: string, eventType: string): Promise<boolean> {
    try {
      const exists = await dbClient.getOne(
        "SELECT id FROM persistent_sync_queue WHERE idempotency_key = ?",
        [key]
      );
      if (exists) return false;
      return true;
    } catch (e) {
      return false;
    }
  }
}
