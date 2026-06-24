import initSqlJs, { Database } from "sql.js";
import { openDB, IDBPDatabase } from "idb";
import { resolveRuntimeNamespace } from "../runtime/runtimeNamespace";

/**
 * Feature gate for the new Runtime Governance architecture.
 * Disable this in production until the architecture is fully verified.
 */
export const ENABLE_RUNTIME_GOVERNANCE = false;

class UserScopedDatabaseClient {
  private db: Database | null = null;
  private idb: IDBPDatabase | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  
  private activeNamespace: string | null = null;
  
  // Lease Fencing Tokens for preventing dual-writer ambiguity
  private activeFencingToken: number | null = null;

  /**
   * Initializes an isolated database for a specific authenticated user.
   */
  async initForUser(userId: string, fencingToken: number): Promise<void> {
    if (!ENABLE_RUNTIME_GOVERNANCE) {
      console.warn("Runtime Governance is feature-gated. Using legacy initialization.");
      return;
    }

    const namespace = resolveRuntimeNamespace(userId);
    if (!namespace) throw new Error("Invalid user ID for database initialization");

    if (this.isInitialized && this.activeNamespace === namespace) {
      // Update fencing token even if already initialized
      this.activeFencingToken = fencingToken;
      return;
    }

    if (this.isInitializing && this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.activeNamespace = namespace;
    this.activeFencingToken = fencingToken;
    this.initPromise = this._initialize(namespace);
    return this.initPromise;
  }

  private async _initialize(namespace: string): Promise<void> {
    try {
      // 1. Initialize IndexedDB isolated by namespace
      this.idb = await openDB(namespace, 2, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (oldVersion < 1) {
            db.createObjectStore("sqlite_file");
          }
          if (oldVersion < 2) {
            db.createObjectStore('action_queue', { keyPath: 'id' });
          }
        },
      });

      // 2. Load sql.js WASM
      const SQL = await initSqlJs({
        locateFile: (file) => `/${file}`,
      });

      // 3. Try to load existing database from IndexedDB
      const savedData = await this.idb.get("sqlite_file", "database.sqlite");

      if (savedData) {
        this.db = new SQL.Database(savedData);
        console.log(`[Runtime DB] Loaded isolated DB for ${namespace}`);
      } else {
        this.db = new SQL.Database();
        // Here we would run the schema creation script for the new tenant
        console.log(`[Runtime DB] Created new isolated DB for ${namespace}`);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error(`[Runtime DB] Failed to initialize for ${namespace}:`, error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Safe execution wrapper that checks the Fencing Token before applying writes.
   * Prevents split-brain / zombie leader writes.
   */
  private checkFencingToken(providedToken: number) {
    if (this.activeFencingToken === null || providedToken !== this.activeFencingToken) {
      throw new Error(
        `[Runtime DB] Lease Fencing Violation! Write rejected. ` +
        `Expected ${this.activeFencingToken}, got ${providedToken}. ` +
        `The current runtime has likely lost leadership.`
      );
    }
  }

  /**
   * Executes a write query ensuring causal fencing semantics.
   */
  public executeWrite(query: string, params: any[], fencingToken: number) {
    if (!this.db || !this.isInitialized) throw new Error("Database not initialized");
    this.checkFencingToken(fencingToken);

    try {
      this.db.run(query, params);
      // We would normally persist to IDB here, omitted for brevity
    } catch (e) {
      console.error("[Runtime DB] Write failed", e);
      throw e;
    }
  }

  /**
   * Safely teardown the database connection when ownership is revoked.
   */
  public async teardown() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    if (this.idb) {
      this.idb.close();
      this.idb = null;
    }
    this.isInitialized = false;
    this.activeNamespace = null;
    this.activeFencingToken = null;
    this.initPromise = null;
    console.log("[Runtime DB] Teardown complete. Runtime destroyed.");
  }
}

export const userScopedDb = new UserScopedDatabaseClient();
