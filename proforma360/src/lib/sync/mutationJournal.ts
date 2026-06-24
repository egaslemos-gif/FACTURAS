import { ENABLE_RUNTIME_GOVERNANCE, userScopedDb } from "../db/userScopedDb";
import { resolveRuntimeNamespace } from "../runtime/runtimeNamespace";
import { runtimeSnapshotManager } from "../runtime/runtimeSnapshots";

/**
 * Defines the consistency required for replaying a mutation.
 * EXACTLY_ONCE was replaced with EFFECTIVELY_ONCE to account for
 * browser limits, relying on idempotency keys instead of 2PC.
 */
export type ConsistencySemantics = "BEST_EFFORT" | "AT_LEAST_ONCE" | "EFFECTIVELY_ONCE";

export type JournalType = "OPERATIONAL" | "ANALYTICAL";

export interface MutationRecord {
  id: string; // UUID
  causalSequenceId: number; // Issued ONLY by the Leader
  type: string;
  journalType: JournalType;
  idempotencyKey: string; // Crucial for EFFECTIVELY_ONCE
  payload: any;
  consistency: ConsistencySemantics;
  isCriticalRetention: boolean; // True for ownership, licensing. Never pruned.
  status: "PENDING" | "APPLIED" | "FAILED" | "ROLLED_BACK";
  timestamp: number;
}

/**
 * The Mutation Journal
 * An event-sourced history of operations. Provides the foundation for
 * Transactional Replays, Rollbacks, and Audit Reconstruction.
 */
class MutationJournal {
  private namespace: string | null = null;
  // In-memory buffer. In reality, this must be persisted into SQLite or IDB synchronously.
  private journalBuffer: MutationRecord[] = [];

  public initialize(userId: string) {
    this.namespace = resolveRuntimeNamespace(userId);
  }

  /**
   * Appends a new mutation to the journal.
   * MUST be executed under a Leader Lock and with a valid Lease Fencing Token.
   */
  public append(mutation: Omit<MutationRecord, "status" | "timestamp" | "idempotencyKey"> & { idempotencyKey?: string }, fencingToken: number) {
    if (!ENABLE_RUNTIME_GOVERNANCE || !this.namespace) return;

    // The userScopedDb ensures the fencing token is valid before applying writes
    // Here we construct the immutable record
    const record: MutationRecord = {
      ...mutation,
      idempotencyKey: mutation.idempotencyKey || crypto.randomUUID(), // Guarantee idempotency key
      status: "PENDING",
      timestamp: Date.now(),
    };

    // Store in buffer (would be written to userScopedDb in full implementation)
    this.journalBuffer.push(record);
    console.log(`[MutationJournal] Appended ${mutation.journalType} ${mutation.type} (Sequence: ${mutation.causalSequenceId})`);
  }

  public markApplied(id: string, fencingToken: number) {
    const record = this.journalBuffer.find((r) => r.id === id);
    if (record) {
      record.status = "APPLIED";
    }
  }

  /**
   * Journal Compaction Strategy
   * Prunes applied events to prevent infinite growth, strictly respecting
   * Retention Semantics and Snapshot Awareness.
   */
  public async compactJournal() {
    console.log(`[MutationJournal] Starting Compaction...`);
    const initialSize = this.journalBuffer.length;
    const hasSnapshot = await runtimeSnapshotManager.getLatestValidSnapshot() !== null;

    this.journalBuffer = this.journalBuffer.filter((record) => {
      // 1. Retention Semantics: Never drop critical events
      if (record.isCriticalRetention) return true;

      if (record.status === "APPLIED") {
        const age = Date.now() - record.timestamp;
        
        // 2. Analytical Journal gets aggressively compacted (1 hour retention)
        if (record.journalType === "ANALYTICAL") {
          const ONE_HOUR = 60 * 60 * 1000;
          if (age > ONE_HOUR) return false;
        }

        // 3. Operational Journal requires a snapshot before it can be safely pruned
        if (record.journalType === "OPERATIONAL") {
          const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
          if (age > SEVEN_DAYS) {
            if (hasSnapshot) return false; // Safe to drop if we have a snapshot
            // If no snapshot exists, we MUST retain operational events to avoid losing DB recovery replay logs
            console.warn(`[MutationJournal] Retained operational event ${record.id} because no Snapshot exists!`);
          }
        }
      }

      return true; // Keep
    });

    const prunedSize = initialSize - this.journalBuffer.length;
    console.log(`[MutationJournal] Compaction finished. Pruned ${prunedSize} records.`);
  }

  public getPendingTransactions(): MutationRecord[] {
    return this.journalBuffer.filter((r) => r.status === "PENDING");
  }
}

export const mutationJournal = new MutationJournal();
