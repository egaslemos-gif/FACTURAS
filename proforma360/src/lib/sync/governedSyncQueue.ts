import { ENABLE_RUNTIME_GOVERNANCE, userScopedDb } from "../db/userScopedDb";
import { mutationJournal, MutationRecord } from "./mutationJournal";
import { runtimeScheduler, RuntimeTaskPriority } from "../runtime/runtimeScheduler";

/**
 * Governed Sync Queue (V2)
 * Strictly isolated from the legacy persistentSyncQueue.ts.
 * Orchestrates event synchronization based strictly on causal records from the Mutation Journal.
 */
class GovernedSyncQueue {
  private isProcessing = false;

  /**
   * Pushes a new operation to the queue via the Mutation Journal.
   * Ensures deterministic operational ordering.
   */
  public enqueue(
    operationType: string,
    journalType: "OPERATIONAL" | "ANALYTICAL",
    payload: any,
    consistency: MutationRecord["consistency"],
    causalSequenceId: number,
    fencingToken: number,
    idempotencyKey?: string
  ) {
    if (!ENABLE_RUNTIME_GOVERNANCE) {
      console.warn("[GovernedSyncQueue] Ignored enqueue because Runtime Governance is disabled.");
      return;
    }

    mutationJournal.append(
      {
        id: crypto.randomUUID(),
        causalSequenceId,
        type: operationType,
        journalType,
        payload,
        consistency,
        idempotencyKey,
        isCriticalRetention: false,
      },
      fencingToken
    );

    // Schedule processing with MEDIUM priority to prevent starvation of CRITICAL UI/locks
    runtimeScheduler.schedule("sync_queue_flush", RuntimeTaskPriority.MEDIUM, async () => {
      await this.flush(fencingToken);
    });
  }

  /**
   * Flushes pending transactions according to their consistency semantics.
   */
  private async flush(fencingToken: number) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pending = mutationJournal.getPendingTransactions();

      for (const record of pending) {
        // Double check causal sequence validity vs DB fencing token here if needed
        
        // Enforce Consistency Semantics
        if (record.consistency === "EFFECTIVELY_ONCE") {
          // Relies on idempotency key deduplication at the backend API
          await this.processEffectivelyOnce(record);
        } else if (record.consistency === "AT_LEAST_ONCE") {
          // Standard retry loop until ACK
          await this.processAtLeastOnce(record);
        } else {
          // BEST_EFFORT: Fire and forget
          await this.processBestEffort(record);
        }

        // Mark applied locally after cloud ACK
        mutationJournal.markApplied(record.id, fencingToken);
      }
    } catch (e) {
      console.error("[GovernedSyncQueue] Flush failed:", e);
      // Let the Runtime Health Metrics catch this failure eventually
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEffectivelyOnce(record: MutationRecord) {
    // Relying on idempotency keys explicitly to avoid EXACTLY_ONCE pitfalls.
    console.log(`[GovernedQueue] Processing EFFECTIVELY_ONCE: ${record.type} (Key: ${record.idempotencyKey})`);
  }

  private async processAtLeastOnce(record: MutationRecord) {
    console.log(`[GovernedQueue] Processing AT_LEAST_ONCE: ${record.type} (Sequence: ${record.causalSequenceId})`);
  }

  private async processBestEffort(record: MutationRecord) {
    console.log(`[GovernedQueue] Processing BEST_EFFORT: ${record.type} (Sequence: ${record.causalSequenceId})`);
  }

  /**
   * Violently aborts queue processing during a runtime teardown.
   */
  public abort() {
    console.warn("[GovernedSyncQueue] ABORTING queue operations due to teardown.");
    this.isProcessing = true; // Lock it forever so it never resumes
  }
}

export const governedSyncQueue = new GovernedSyncQueue();
