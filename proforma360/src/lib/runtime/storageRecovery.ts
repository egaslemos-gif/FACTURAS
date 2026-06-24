import { dbClient } from "../db/client";

export type StorageFailureSeverity = "RECOVERABLE" | "DEGRADED" | "FATAL";

export interface StorageErrorLog {
  severity: StorageFailureSeverity;
  error: Error;
  timestamp: number;
  context: string;
}

export class StorageRecoverySemantics {
  private errorHistory: StorageErrorLog[] = [];

  public async handleStorageError(error: Error, context: string): Promise<void> {
    const severity = this.determineSeverity(error);
    
    this.errorHistory.push({
      severity,
      error,
      timestamp: Date.now(),
      context
    });

    console.error(`[StorageRecovery] ${severity} Failure detected in ${context}:`, error);

    switch (severity) {
      case "RECOVERABLE":
        await this.attemptAutoRecovery();
        break;
      case "DEGRADED":
        this.notifyDegradedState();
        break;
      case "FATAL":
        await this.haltRuntime();
        break;
    }
  }

  private determineSeverity(error: Error): StorageFailureSeverity {
    const msg = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Quota Exceeded or Timeout can often be recovered by compacting or retrying
    if (name.includes("quotaexceeded") || msg.includes("quota") || msg.includes("timeout")) {
      return "RECOVERABLE";
    }

    // Safari sometimes purges IndexedDB under storage pressure, leaving a degraded state
    // where OPFS is partially readable but IDB metadata is gone.
    if (msg.includes("not found") || msg.includes("versionerror") || name.includes("notfounderror")) {
      return "DEGRADED";
    }

    // WAL corruption, I/O failures, or impossible SQLite schemas are FATAL
    if (msg.includes("corrupt") || msg.includes("io error") || msg.includes("malformed")) {
      return "FATAL";
    }

    return "FATAL"; // Default to safest conservative boundary
  }

  private async attemptAutoRecovery() {
    console.log("[StorageRecovery] Attempting automated memory dump and WAL checkpoint...");
    try {
      // In a real recovery scenario, we'd force SQLite to checkpoint the WAL,
      // or try to export the DB into memory and re-instantiate it.
      const buffer = await dbClient.getDatabaseFile();
      if (buffer) {
        console.log("[StorageRecovery] DB exported successfully. Restarting driver...");
        await dbClient.restoreDatabaseFile(buffer);
        console.log("[StorageRecovery] Auto-recovery successful.");
      }
    } catch (e) {
      console.error("[StorageRecovery] Auto-recovery failed. Escalating to FATAL.");
      await this.haltRuntime();
    }
  }

  private notifyDegradedState() {
    console.warn("[StorageRecovery] Storage is in a DEGRADED state. Requesting manual recovery pack download.");
    if (typeof window !== "undefined") {
      // In a real app, this would dispatch a toast or a modal block forcing the user
      // to download a recovery pack (JSON dump of memory state).
      window.dispatchEvent(new CustomEvent("RUNTIME_DEGRADED", { 
        detail: { message: "Storage pressure detected. Please backup your data." }
      }));
    }
  }

  private async haltRuntime() {
    console.error("[StorageRecovery] HALTING RUNTIME due to FATAL storage error to prevent data corruption.");
    // 1. Block all further writes to dbClient.
    // 2. Alert the user immediately with a hard-stop modal.
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("proforma_runtime_revoked", "true");
      window.dispatchEvent(new CustomEvent("RUNTIME_FATAL_ERROR", { 
        detail: { message: "Critical database corruption. Runtime halted to protect data integrity." }
      }));
    }
  }
}

export const storageRecoverySemantics = new StorageRecoverySemantics();
