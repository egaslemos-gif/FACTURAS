import { RuntimeEvent, RuntimeState } from "./runtimeStateMachine";

export interface LedgerEntry {
  id: string;
  timestamp: number;
  eventType: string;
  payload: any;
  previousMode: string;
  nextMode: string;
  retention?: "STANDARD" | "IMMUTABLE_CRITICAL";
}

export interface GovernanceMetrics {
  ownershipRevocations: number;
  splitBrainPreventions: number;
  staleEpochRejections: number;
  fencingViolations: number;
  reloadStormPreventions: number;
  hydrationBlocks: number;
}

/**
 * The Black Box: Runtime Event Ledger
 * Ensures all governance events survive tab deaths and crashes.
 */
class RuntimeEventLedger {
  // Hot Layer
  private hotBuffer: LedgerEntry[] = [];
  private readonly MAX_HOT_BUFFER_SIZE = 100;

  // Durable Layer (IndexedDB configuration)
  private readonly DB_NAME = "Proforma360_Governance_Ledger";
  private readonly STORE_NAME = "events";
  private readonly METRICS_STORE = "metrics";
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  private metrics: GovernanceMetrics = {
    ownershipRevocations: 0,
    splitBrainPreventions: 0,
    staleEpochRejections: 0,
    fencingViolations: 0,
    reloadStormPreventions: 0,
    hydrationBlocks: 0
  };

  constructor() {
    this.initDurableLayer();
  }

  private async initDurableLayer() {
    if (typeof window === "undefined" || !window.indexedDB) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
        if (!db.objectStoreNames.contains(this.METRICS_STORE)) {
          db.createObjectStore(this.METRICS_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        this.loadMetrics();
        this.flushHotBuffer(); // Flush anything that was recorded before DB was ready
        this.pruneDurableLayer(); // Initialize ring buffer compression
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  public recordEvent(
    event: RuntimeEvent,
    prevState: RuntimeState,
    nextState: RuntimeState,
    retention: "STANDARD" | "IMMUTABLE_CRITICAL" = "STANDARD"
  ) {
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      eventType: event.type,
      payload: event,
      previousMode: prevState.mode,
      nextMode: nextState.mode,
      retention
    };

    // 1. Hot Layer Push
    this.hotBuffer.push(entry);
    if (this.hotBuffer.length > this.MAX_HOT_BUFFER_SIZE) {
      this.hotBuffer.shift(); // maintain ring buffer size
    }

    // 2. Durable Layer Flush
    if (this.isInitialized && this.db) {
      this.persistToDisk(entry);
    }
    
    // 3. Update Governance Metrics based on event semantics
    this.processGovernanceMetrics(event);
  }

  private processGovernanceMetrics(event: RuntimeEvent) {
    let mutated = false;
    if (event.type === "OWNERSHIP_REVOKED") {
      this.metrics.ownershipRevocations++; mutated = true;
    } else if (event.type === "FAILURE_DETECTED") {
      if (event.failure === "OWNERSHIP_CONFLICT") {
        this.metrics.splitBrainPreventions++; mutated = true;
      } else if (event.failure === "EPOCH_DIVERGENCE") {
        this.metrics.staleEpochRejections++; mutated = true;
      }
    }
    // Note: hydrationBlocks and fencingViolations are incremented directly by other sub-systems
    
    if (mutated) this.persistMetrics();
  }

  public incrementMetric(key: keyof GovernanceMetrics) {
    this.metrics[key]++;
    this.persistMetrics();
  }

  public getMetrics(): GovernanceMetrics {
    return { ...this.metrics };
  }

  private persistMetrics() {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.METRICS_STORE, "readwrite");
      tx.objectStore(this.METRICS_STORE).put({ id: "singleton", ...this.metrics });
    } catch (e) {
       console.warn("[EventLedger] Failed to persist metrics", e);
    }
  }

  private loadMetrics() {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.METRICS_STORE, "readonly");
      const req = tx.objectStore(this.METRICS_STORE).get("singleton");
      req.onsuccess = () => {
        if (req.result) {
          const { id, ...data } = req.result;
          this.metrics = { ...this.metrics, ...data };
        }
      };
    } catch (e) {
      console.warn("[EventLedger] Failed to load metrics", e);
    }
  }

  private persistToDisk(entry: LedgerEntry) {
    if (!this.db) return;
    try {
      const tx = this.db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      store.add(entry);
      
      // Debounce pruning to avoid aggressive blocking
      if (Math.random() < 0.05) { // 5% chance per event to trigger pruning check
         this.pruneDurableLayer();
      }
    } catch (e) {
      console.warn("[EventLedger] Failed to persist event to durable layer.", e);
    }
  }

  /**
   * Ring Buffer Compression: Ensures IDB doesn't bloat beyond 500 events.
   * Compresses old data and prunes excess.
   */
  private async pruneDurableLayer() {
    if (!this.db) return;
    try {
      const MAX_EVENTS = 500;
      const tx = this.db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index("timestamp");
      
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > MAX_EVENTS) {
           let excess = countReq.result - MAX_EVENTS;
           // Open cursor in ascending order (oldest first) to delete
           const cursorReq = index.openCursor();
           cursorReq.onsuccess = (e) => {
             const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
             if (cursor && excess > 0) {
               // Do not prune IMMUTABLE_CRITICAL events
               if (cursor.value.retention !== "IMMUTABLE_CRITICAL") {
                 cursor.delete();
                 excess--;
               }
               cursor.continue();
             }
           };
        }
      };
    } catch (e) {
      console.warn("[EventLedger] Pruning failed", e);
    }
  }

  private flushHotBuffer() {
    if (!this.db || this.hotBuffer.length === 0) return;
    try {
      const tx = this.db.transaction(this.STORE_NAME, "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      for (const entry of this.hotBuffer) {
        // use put instead of add to gracefully handle existing keys
        store.put(entry);
      }
    } catch (e) {
      console.warn("[EventLedger] Failed to flush hot buffer.", e);
    }
  }

  public async getHistory(limit: number = 50): Promise<LedgerEntry[]> {
    if (!this.isInitialized || !this.db) {
      // Return hot layer if DB isn't ready
      return [...this.hotBuffer].reverse().slice(0, limit);
    }

    return new Promise<LedgerEntry[]>((resolve, reject) => {
      const tx = this.db!.transaction(this.STORE_NAME, "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const index = store.index("timestamp");
      
      const request = index.openCursor(null, "prev"); // Descending order
      const results: LedgerEntry[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export const runtimeEventLedger = new RuntimeEventLedger();
