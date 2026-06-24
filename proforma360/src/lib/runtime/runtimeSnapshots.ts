import { openDB, IDBPDatabase } from "idb";
import { getActiveTenantHash } from "./runtimeNamespace";

const SNAPSHOT_DB = "Proforma360_Snapshots";
const SNAPSHOT_STORE = "snapshots";
const MAX_SNAPSHOT_COUNT = 3;
const MAX_SNAPSHOT_AGE_DAYS = 7;

export interface RuntimeSnapshot {
  id: string; // e.g. "snapshot_1690000000000"
  tenantHash: string;
  epoch: string; // Must match the active epoch to be valid for resurrecting
  timestamp: number;
  data: Uint8Array; // SQLite export buffer
  checksum: string; // Simple verification
  snapshotCreatedFromVersion: string; // e.g., "1.2.0"
}

export class RuntimeSnapshotManager {
  private db: IDBPDatabase | null = null;

  private async initDB() {
    if (!this.db) {
      this.db = await openDB(SNAPSHOT_DB, 1, {
        upgrade(db) {
          const store = db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
          store.createIndex("tenantHash", "tenantHash", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      });
    }
    return this.db;
  }

  public async createSnapshot(data: Uint8Array, kernelVersion: string): Promise<void> {
    const db = await this.initDB();
    const tenantHash = getActiveTenantHash();
    if (!tenantHash) throw new Error("No active tenant hash for snapshot.");

    const epoch = localStorage.getItem('runtime_active_epoch');
    if (!epoch) throw new Error("No active epoch for snapshot.");

    const timestamp = Date.now();
    const id = `snapshot_${timestamp}`;
    const checksum = await this.generateChecksum(data);

    const snapshot: RuntimeSnapshot = {
      id,
      tenantHash,
      epoch,
      timestamp,
      data,
      checksum,
      snapshotCreatedFromVersion: kernelVersion,
    };

    const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
    await tx.objectStore(SNAPSHOT_STORE).add(snapshot);
    await tx.done;

    await this.pruneSnapshots(tenantHash);
  }

  public async getLatestValidSnapshot(): Promise<RuntimeSnapshot | null> {
    const db = await this.initDB();
    const tenantHash = getActiveTenantHash();
    if (!tenantHash) return null;

    const tx = db.transaction(SNAPSHOT_STORE, "readonly");
    const index = tx.objectStore(SNAPSHOT_STORE).index("tenantHash");
    let cursor = await index.openCursor(IDBKeyRange.only(tenantHash), "prev");

    while (cursor) {
      const snapshot = cursor.value as RuntimeSnapshot;
      if (await this.validateSnapshotIntegrity(snapshot)) {
        return snapshot;
      }
      cursor = await cursor.continue();
    }
    return null;
  }

  private async validateSnapshotIntegrity(snapshot: RuntimeSnapshot): Promise<boolean> {
    const activeEpoch = localStorage.getItem('runtime_active_epoch');
    if (snapshot.epoch !== activeEpoch) {
      console.warn(`[SnapshotManager] Rejected snapshot ${snapshot.id} due to STALE EPOCH.`);
      return false;
    }

    const ageDays = (Date.now() - snapshot.timestamp) / (1000 * 60 * 60 * 24);
    if (ageDays > MAX_SNAPSHOT_AGE_DAYS) {
      console.warn(`[SnapshotManager] Rejected snapshot ${snapshot.id} due to AGE (${ageDays.toFixed(1)} days).`);
      return false;
    }

    const currentChecksum = await this.generateChecksum(snapshot.data);
    if (currentChecksum !== snapshot.checksum) {
      console.warn(`[SnapshotManager] Rejected snapshot ${snapshot.id} due to CHECKSUM MISMATCH.`);
      return false;
    }

    if (!snapshot.snapshotCreatedFromVersion) {
        console.warn(`[SnapshotManager] Rejected snapshot ${snapshot.id} due to missing version metadata.`);
        return false;
    }

    return true;
  }

  private async pruneSnapshots(tenantHash: string) {
    const db = await this.initDB();
    const tx = db.transaction(SNAPSHOT_STORE, "readwrite");
    const index = tx.objectStore(SNAPSHOT_STORE).index("tenantHash");
    
    const snapshots: RuntimeSnapshot[] = [];
    let cursor = await index.openCursor(IDBKeyRange.only(tenantHash), "prev");
    while (cursor) {
      snapshots.push(cursor.value);
      cursor = await cursor.continue();
    }

    if (snapshots.length > MAX_SNAPSHOT_COUNT) {
      const toDelete = snapshots.slice(MAX_SNAPSHOT_COUNT);
      for (const snap of toDelete) {
        await tx.objectStore(SNAPSHOT_STORE).delete(snap.id);
        console.log(`[SnapshotManager] Pruned excess snapshot: ${snap.id}`);
      }
    }
    await tx.done;
  }

  private async generateChecksum(data: Uint8Array): Promise<string> {
    // Type cast to BufferSource to resolve the SharedArrayBuffer vs ArrayBuffer conflict
    // This ensures the compiler accepts the Uint8Array regardless of the underlying buffer type.
    const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const runtimeSnapshotManager = new RuntimeSnapshotManager();
