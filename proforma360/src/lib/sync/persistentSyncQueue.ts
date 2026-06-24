import { dbClient } from "../db/client";
import { EVENT_CONTRACTS, QueuePriority, validateEventPayload } from "./eventContracts";
import { IdempotencyManager } from "./idempotency";
import { useNetworkStore } from "@/stores/useNetworkStore";

export interface SyncQueueItem {
  id: string;
  eventType: string;
  payload: any;
  status: "PENDING" | "RETRY_SCHEDULED" | "IN_FLIGHT" | "ACKED" | "ABORTED" | "ORPHANED" | "REVOKED" | "DEAD_LETTER";
  retries: number;
  nextAttemptAt: string | null;
  priority: QueuePriority;
  idempotencyKey: string | null;
  version: number;
  createdAt: string;
}

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2000;

export class PersistentSyncQueue {
  private static isProcessing = false;

  /**
   * Enqueues an event to the persistent sync queue
   */
  static async enqueue(
    eventType: string,
    payload: any,
    customIdempotencyKey?: string
  ): Promise<boolean> {
    const contract = EVENT_CONTRACTS[eventType];
    if (!contract) {
      console.warn(`[PersistentSyncQueue] Unknown event type: ${eventType}`);
      return false;
    }

    // Validate event contracts
    if (!validateEventPayload(eventType, payload)) {
      console.error(`[PersistentSyncQueue] Payload validation failed for ${eventType}`);
      return false;
    }

    const priority = contract.priority;
    const version = contract.version;
    const idempotencyKey = customIdempotencyKey || IdempotencyManager.generateKey(eventType, payload);

    // Idempotency Layer check
    const isDuplicate = await IdempotencyManager.isDuplicate(idempotencyKey);
    if (isDuplicate) {
      console.log(`[PersistentSyncQueue] Duplicate event ignored for key: ${idempotencyKey}`);
      return true; // Already processed
    }

    // Check if it already exists in queue to avoid duplicate pending enqueues
    try {
      const existing = await dbClient.getOne(
        "SELECT id, status FROM persistent_sync_queue WHERE idempotency_key = ?",
        [idempotencyKey]
      );
      if (existing) {
        if (existing.status === "PENDING" || existing.status === "RETRY_SCHEDULED") {
          return true; // Already queued
        }
      }
    } catch (e) {
      // Ignore database errors
    }

    const id = typeof crypto !== "undefined" && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `seq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const nowStr = new Date().toISOString();

    try {
      await dbClient.executeWrite(
        `INSERT OR REPLACE INTO persistent_sync_queue 
         (id, event_type, payload, status, retries, next_attempt_at, priority, idempotency_key, version, created_at) 
         VALUES (?, ?, ?, 'PENDING', 0, ?, ?, ?, ?, ?)`,
        [
          id,
          eventType,
          JSON.stringify(payload),
          nowStr,
          priority,
          idempotencyKey,
          version,
          nowStr,
        ]
      );

      // Trigger runner asynchronously if online
      if (typeof window !== "undefined" && navigator.onLine) {
        this.processQueue();
      }
      return true;
    } catch (error) {
      console.error("[PersistentSyncQueue] Enqueue failed:", error);
      return false;
    }
  }

  /**
   * Main runner. Processes pending/failed actions in priority order.
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const nowStr = new Date().toISOString();
      // Fetch queue items needing retry/process
      const rows = await dbClient.query(
        `SELECT * FROM persistent_sync_queue 
         WHERE status IN ('PENDING', 'RETRY_SCHEDULED') 
         AND (next_attempt_at IS NULL OR next_attempt_at <= ?)`,
        [nowStr]
      );

      if (rows.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Sort by Priority (HIGH -> MEDIUM -> LOW) and then createdAt
      const priorityWeights: Record<QueuePriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const sortedQueue: SyncQueueItem[] = rows.map((r: any) => ({
        id: r.id,
        eventType: r.event_type,
        payload: JSON.parse(r.payload),
        status: r.status,
        retries: r.retries,
        nextAttemptAt: r.next_attempt_at,
        priority: r.priority as QueuePriority,
        idempotencyKey: r.idempotency_key,
        version: r.version,
        createdAt: r.created_at,
      })).sort((a, b) => {
        const diff = priorityWeights[b.priority] - priorityWeights[a.priority];
        if (diff !== 0) return diff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      for (const item of sortedQueue) {
        // Double check network connectivity
        if (typeof window !== "undefined" && !navigator.onLine) {
          console.log("[PersistentSyncQueue] Offline, pausing processing.");
          break;
        }

        // Battery conservation check (do not process LOW priority items if battery < 15% and not charging)
        if (typeof window !== "undefined" && "getBattery" in navigator) {
          try {
            const battery = await (navigator as any).getBattery();
            if (battery.level < 0.15 && !battery.charging && item.priority === "LOW") {
              console.log(`[PersistentSyncQueue] Low battery (${Math.round(battery.level * 100)}%), deferring low-priority task.`);
              continue;
            }
          } catch (e) {
            // Ignore battery errors
          }
        }

        try {
          // Conflict Resolution Strategy
          const isConflicted = await this.checkConflict(item);
          if (isConflicted) {
            await dbClient.executeWrite(
              "UPDATE persistent_sync_queue SET status = 'ABORTED' WHERE id = ?",
              [item.id]
            );
            console.warn(`[PersistentSyncQueue] Conflict detected for action ${item.eventType}. Skipping.`, item.payload);
            continue;
          }

          // Execute action
          await this.executeAction(item);

          // Success: Mark completed to satisfy idempotency check
          await dbClient.executeWrite(
            "UPDATE persistent_sync_queue SET status = 'ACKED', next_attempt_at = NULL WHERE id = ?",
            [item.id]
          );
        } catch (error) {
          console.error(`[PersistentSyncQueue] Failed to execute ${item.eventType}:`, error);
          
          const newRetries = item.retries + 1;
          if (newRetries >= MAX_RETRIES) {
            await dbClient.executeWrite(
              "UPDATE persistent_sync_queue SET status = 'DEAD_LETTER', retries = ? WHERE id = ?",
              [newRetries, item.id]
            );
          } else {
            const backoffMs = BASE_BACKOFF_MS * Math.pow(2, newRetries);
            const nextAttempt = new Date(Date.now() + backoffMs).toISOString();
            await dbClient.executeWrite(
              "UPDATE persistent_sync_queue SET status = 'RETRY_SCHEDULED', retries = ?, next_attempt_at = ? WHERE id = ?",
              [newRetries, nextAttempt, item.id]
            );
          }
        }
      }

      // Cleanup expired completed records based on retention contract rules
      await this.pruneRetentionRecords();

    } catch (e) {
      console.error("[PersistentSyncQueue] processQueue error:", e);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Conflict checks (e.g. check if quotation has been updated in database after this sync action was generated)
   */
  private static async checkConflict(item: SyncQueueItem): Promise<boolean> {
    const payload = item.payload;
    if (!payload || !payload.quotationId) return false;

    try {
      // Find the entity in our SQLite DB
      const current = await dbClient.getOne(
        "SELECT updated_at FROM quotations WHERE id = ?",
        [payload.quotationId]
      );

      if (current && payload.updatedAt) {
        // Last-Write-Wins based on ISO timestamps
        const localTime = new Date(current.updated_at).getTime();
        const payloadTime = new Date(payload.updatedAt).getTime();
        if (localTime > payloadTime) {
          // Local state is newer, sync action is outdated
          return true;
        }
      }
    } catch (e) {
      // If table/query fails, default to no conflict
    }

    return false;
  }

  /**
   * Internal execution router
   */
  private static async executeAction(item: SyncQueueItem): Promise<void> {
    const { eventType, payload } = item;
    
    // Simulate/mock API integrations or call calendar sync libs
    console.log(`[PersistentSyncQueue] Executing action: ${eventType}`, payload);

    if (eventType === "CALENDAR_SYNC") {
      // Import and trigger calendar integration dynamically
      try {
        const { CalendarSyncOrchestrator } = await import("./calendarSync");
        await CalendarSyncOrchestrator.syncQuotationAction(payload.quotationId);
      } catch (err) {
        console.error("[PersistentSyncQueue] Calendar Sync execution error:", err);
        throw err;
      }
    }

    // In a real production deployment, this would perform fetch() API calls to the server
    await new Promise((resolve, reject) => {
      // 10% chance to fail to test resilience / retries
      if (Math.random() < 0.1) {
        reject(new Error("Simulated network timeout/API error"));
      } else {
        resolve(true);
      }
    });
  }

  /**
   * Prunes completed or conflict events after their retentionDays expired
   */
  private static async pruneRetentionRecords(): Promise<void> {
    try {
      const now = new Date();
      for (const [eventType, contract] of Object.entries(EVENT_CONTRACTS)) {
        const cutoffDate = new Date(now.getTime() - contract.retentionDays * 24 * 60 * 60 * 1000).toISOString();
        await dbClient.executeWrite(
          "DELETE FROM persistent_sync_queue WHERE event_type = ? AND status IN ('ACKED', 'DEAD_LETTER', 'ABORTED', 'ORPHANED', 'REVOKED') AND created_at < ?",
          [eventType, cutoffDate]
        );
      }
    } catch (e) {
      console.error("[PersistentSyncQueue] Pruning failed:", e);
    }
  }

  /**
   * Returns count of all unsynced queue actions
   */
  static async getUnsyncedCount(): Promise<number> {
    try {
      const row = await dbClient.getOne(
        "SELECT COUNT(*) as cnt FROM persistent_sync_queue WHERE status IN ('PENDING', 'RETRY_SCHEDULED')"
      );
      return row ? row.cnt : 0;
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Aborts all pending and retrying queues. Usually triggered during session isolation mode (logout).
   */
  static async abortAll(): Promise<void> {
    try {
      this.isProcessing = false;
      await dbClient.executeWrite(
        "UPDATE persistent_sync_queue SET status = 'ORPHANED' WHERE status IN ('PENDING', 'RETRY_SCHEDULED')"
      );
      console.log(`[PersistentSyncQueue] All pending and retrying syncs have been orphaned/aborted.`);
    } catch (e) {
      console.error("[PersistentSyncQueue] abortAll error:", e);
    }
  }
}

// Auto-run when browser comes back online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    PersistentSyncQueue.processQueue();
  });
}
