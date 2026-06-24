export interface ConflictLogEntry {
  documentId: string;
  fieldKey: string;
  previousValue: any;
  newValue: any;
  deviceId: string;
  timestamp: number;
  resolutionStrategy: "LWW_TIMESTAMP" | "SHALLOW_MERGE_WIN" | "MANUAL_OVERRIDE";
}

/**
 * Tracks and audits any offline conflicts resolved automatically by the engine.
 * Ensures data destruction is never silent.
 */
export class ConflictAuditTrail {
  private static logs: ConflictLogEntry[] = [];

  static logConflict(entry: ConflictLogEntry) {
    this.logs.push(entry);
    // In production, this would sync to the server or local SQLite 'audit_logs' table.
    console.warn(`[ConflictAudit] Resolved conflict on field '${entry.fieldKey}':`, entry);
  }

  static getLogs(documentId: string): ConflictLogEntry[] {
    return this.logs.filter(l => l.documentId === documentId);
  }
}
