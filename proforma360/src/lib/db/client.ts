import initSqlJs, { Database } from "sql.js";

// Import IndexedDB wrapper to persist the SQLite file in browser
import { openDB, IDBPDatabase } from "idb";
import { useSyncStore } from "@/stores/sync";

const DB_NAME = "proforma360_db";
const STORE_NAME = "sqlite_file";
// FILE_KEY is now dynamic per tenant

class DatabaseClient {
  private db: Database | null = null;
  private idb: IDBPDatabase | null = null;
  private isInitialized = false;
  public isNewDatabase = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private fileKey = "database.sqlite"; // Default legacy, overwritten by setTenantHash

  public async setTenantHash(tenantHash: string): Promise<void> {
    const newFileKey = `database_${tenantHash}.sqlite`;
    if (this.fileKey === newFileKey && this.isInitialized) return;

    if (this.isInitialized) {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      this.isInitialized = false;
      this.initPromise = null;
    }

    if (!this.idb) {
      this.idb = await openDB(DB_NAME, 2, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (oldVersion < 1) db.createObjectStore(STORE_NAME);
          if (oldVersion < 2) db.createObjectStore('action_queue', { keyPath: 'id' });
        },
      });
    }

    // Migration logic
    const existingTenantData = await this.idb.get(STORE_NAME, newFileKey);
    if (!existingTenantData) {
      const legacyData = await this.idb.get(STORE_NAME, "database.sqlite");
      const migrationStamp = localStorage.getItem('legacy_migrated_to');
      
      if (legacyData && (!migrationStamp || migrationStamp === tenantHash)) {
        // Migrate ONLY if never migrated OR if the stamp matches this tenant
        // (re-migration for the rightful owner after a cache clear)
        await this.idb.put(STORE_NAME, legacyData, newFileKey);
        localStorage.setItem('legacy_migrated_to', tenantHash);
        console.log(`[Database] Legacy database safely migrated to runtime owner: ${tenantHash}`);
      } else if (legacyData && migrationStamp && migrationStamp !== tenantHash) {
        // Legacy DB belongs to a different tenant — DO NOT migrate
        console.log(`[Database] Legacy DB belongs to tenant ${migrationStamp}, skipping migration for ${tenantHash}`);
      }
    }
    
    this.fileKey = newFileKey;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing && this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      // 1. Initialize IndexedDB
      this.idb = await openDB(DB_NAME, 2, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (oldVersion < 1) {
            db.createObjectStore(STORE_NAME);
          }
          if (oldVersion < 2) {
            db.createObjectStore('action_queue', { keyPath: 'id' });
          }
        },
      });

      // 2. Load sql.js WASM
      const SQL = await initSqlJs({
        // Since we are in Next.js, we need to load the wasm file from public folder
        // We will copy sql-wasm.wasm to public/ later
        locateFile: (file) => `/${file}`,
      });

      // 3. Try to load existing database from IndexedDB
      const savedData = await this.idb.get(STORE_NAME, this.fileKey);

      if (savedData) {
        // Load existing
        this.db = new SQL.Database(savedData);
        console.log("Database loaded from IndexedDB.");
        
        // Run migrations for existing DBs
        const safeRun = (query: string) => {
          try {
            this.db?.run(query);
          } catch (e) {
            // Ignore column exists errors
          }
        };

        // Migration 1: pdf_template
        safeRun("ALTER TABLE companies ADD COLUMN pdf_template TEXT DEFAULT 'minimal'");
        // Migration 2: Financial fields
        safeRun("ALTER TABLE companies ADD COLUMN bank_name TEXT");
        safeRun("ALTER TABLE companies ADD COLUMN account_holder TEXT");
        safeRun("ALTER TABLE companies ADD COLUMN account_number TEXT");
        safeRun("ALTER TABLE companies ADD COLUMN nib_iban TEXT");
        safeRun("ALTER TABLE companies ADD COLUMN mpesa TEXT");
        safeRun("ALTER TABLE companies ADD COLUMN emola TEXT");
        // Migration 3: Client fields
        safeRun("ALTER TABLE clients ADD COLUMN origin TEXT");
        safeRun("ALTER TABLE clients ADD COLUMN tags TEXT");
        // Migration 4: Rename classic to minimal in existing rows
        safeRun("UPDATE companies SET pdf_template = 'minimal' WHERE pdf_template = 'classic'");
        // Migration 5: Add sent_at
        safeRun("ALTER TABLE quotations ADD COLUMN sent_at TEXT");
        // Migration 6: Add show_branding
        safeRun("ALTER TABLE companies ADD COLUMN show_branding INTEGER DEFAULT 1");
        // Migration 7: CRM Pipeline fields
        safeRun("ALTER TABLE quotations ADD COLUMN pipeline_stage TEXT DEFAULT 'lead'");
        safeRun("ALTER TABLE quotations ADD COLUMN next_action TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN next_action_date TEXT");
        // Migration 8: Client Interactions table
        this.db?.run(`
          CREATE TABLE IF NOT EXISTS client_interactions (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            created_at TEXT,
            FOREIGN KEY(client_id) REFERENCES clients(id)
          )
        `);
        // Migration 9: Priority
        safeRun("ALTER TABLE quotations ADD COLUMN priority TEXT DEFAULT 'medium'");
        // Migration 10: Pipeline Operations Phase 1
        safeRun("ALTER TABLE quotations ADD COLUMN next_action_time TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN last_activity_at TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN last_contact_at TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN reminders_enabled INTEGER DEFAULT 1");
        
        // Migration 11: Pipeline Operations Phase 2 & Calendar Sync Fields
        safeRun("ALTER TABLE quotations ADD COLUMN assigned_user TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN followup_status TEXT DEFAULT 'pending'");
        safeRun("ALTER TABLE quotations ADD COLUMN reminder_offset TEXT DEFAULT '15m'");
        safeRun("ALTER TABLE quotations ADD COLUMN completed_at TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN calendar_sync_enabled INTEGER DEFAULT 0");
        safeRun("ALTER TABLE quotations ADD COLUMN external_calendar_provider TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN calendar_sync_status TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN calendar_sync_date TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN external_calendar_event_id TEXT");
        safeRun("ALTER TABLE quotations ADD COLUMN calendar_sync_error TEXT");
        
        // Migration 12: Telemetry & Persistent Sync Queue
        this.db?.run(`
          CREATE TABLE IF NOT EXISTS proposal_telemetry (
            quotation_id TEXT PRIMARY KEY,
            views_count INTEGER DEFAULT 0,
            downloads_count INTEGER DEFAULT 0,
            last_viewed_at TEXT,
            FOREIGN KEY(quotation_id) REFERENCES quotations(id)
          )
        `);
        this.db?.run(`
          CREATE TABLE IF NOT EXISTS persistent_sync_queue (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            payload TEXT,
            status TEXT DEFAULT 'pending',
            retries INTEGER DEFAULT 0,
            next_attempt_at TEXT,
            priority TEXT DEFAULT 'medium',
            idempotency_key TEXT UNIQUE,
            version INTEGER DEFAULT 1,
            created_at TEXT
          )
        `);
        
        // Migration 13: Runtime Diagnostics Log
        this.db?.run(`
          CREATE TABLE IF NOT EXISTS runtime_diagnostics (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            message TEXT,
            timestamp TEXT
          )
        `);

        // Migration 15: Replay Determinism Receipts
        this.db?.run(`
          CREATE TABLE IF NOT EXISTS document_execution_receipts (
            id TEXT PRIMARY KEY,
            quotation_id TEXT,
            semantic_schema_signature TEXT,
            execution_plan_signature TEXT,
            totals_ast_signature TEXT,
            runtime_kernel_version TEXT,
            timestamp TEXT
          )
        `);
        this.db?.run(`
          CREATE TABLE IF NOT EXISTS runtime_replay_receipts (
            id TEXT PRIMARY KEY,
            quotation_id TEXT,
            replay_context TEXT,
            determinism_result TEXT,
            semantic_schema_signature TEXT,
            execution_plan_signature TEXT,
            totals_ast_signature TEXT,
            timestamp TEXT
          )
        `);
        
        await this.save();
      } else {
        // Create new
        this.db = new SQL.Database();
        this.createSchema();
        await this.save();
        this.isNewDatabase = true;
        console.log("New database created and saved.");
      }

      this.isInitialized = true;
    } catch (error: any) {
      console.error("Failed to initialize database:", error);
      try {
        const { storageRecoverySemantics } = await import("@/lib/runtime/storageRecovery");
        await storageRecoverySemantics.handleStorageError(error, "DatabaseInitialization");
      } catch (recoveryError) {
        console.error("Critical failure in storage recovery semantics:", recoveryError);
      }
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private createSchema() {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tax_number TEXT,
        address TEXT,
        email TEXT,
        phone TEXT,
        logo_url TEXT,
        signature_url TEXT,
        stamp_url TEXT,
        footer_text TEXT,
        quotation_prefix TEXT DEFAULT 'PF',
        pdf_template TEXT DEFAULT 'minimal',
        bank_name TEXT,
        account_holder TEXT,
        account_number TEXT,
        nib_iban TEXT,
        mpesa TEXT,
        emola TEXT,
        show_branding INTEGER DEFAULT 1,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tax_number TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        notes TEXT,
        origin TEXT,
        tags TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price REAL,
        vat REAL,
        unit TEXT,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id TEXT PRIMARY KEY,
        quotation_number TEXT NOT NULL,
        client_id TEXT,
        document_context TEXT DEFAULT 'GENERAL',
        schema_version TEXT DEFAULT 'v1',
        semantic_schema_signature TEXT,
        execution_plan_signature TEXT,
        totals_ast_signature TEXT,
        dynamic_fields TEXT,
        date TEXT,
        expiry_date TEXT,
        status TEXT DEFAULT 'draft',
        pipeline_stage TEXT DEFAULT 'lead',
        priority TEXT DEFAULT 'medium',
        next_action TEXT,
        next_action_date TEXT,
        next_action_time TEXT,
        last_activity_at TEXT,
        last_contact_at TEXT,
        reminders_enabled INTEGER DEFAULT 1,
        assigned_user TEXT,
        followup_status TEXT DEFAULT 'pending',
        reminder_offset TEXT DEFAULT '15m',
        completed_at TEXT,
        calendar_sync_enabled INTEGER DEFAULT 0,
        external_calendar_provider TEXT,
        calendar_sync_status TEXT,
        calendar_sync_date TEXT,
        external_calendar_event_id TEXT,
        calendar_sync_error TEXT,
        subtotal REAL,
        discount REAL DEFAULT 0,
        discount_type TEXT DEFAULT 'percentage',
        vat_total REAL,
        grand_total REAL,
        notes TEXT,
        terms TEXT,
        pdf_url TEXT,
        pdf_drive_id TEXT,
        sent_at TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY(client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        product_id TEXT,
        description TEXT,
        quantity REAL,
        unit_price REAL,
        vat_rate REAL,
        total REAL,
        sort_order INTEGER,
        dynamic_fields TEXT,
        FOREIGN KEY(quotation_id) REFERENCES quotations(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS quotation_history (
        id TEXT PRIMARY KEY,
        quotation_id TEXT NOT NULL,
        action TEXT NOT NULL,
        old_status TEXT,
        new_status TEXT,
        details TEXT,
        created_at TEXT,
        FOREIGN KEY(quotation_id) REFERENCES quotations(id)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS client_interactions (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT,
        FOREIGN KEY(client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS proposal_telemetry (
        quotation_id TEXT PRIMARY KEY,
        views_count INTEGER DEFAULT 0,
        downloads_count INTEGER DEFAULT 0,
        last_viewed_at TEXT,
        FOREIGN KEY(quotation_id) REFERENCES quotations(id)
      );

      CREATE TABLE IF NOT EXISTS persistent_sync_queue (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        payload TEXT,
        status TEXT DEFAULT 'pending',
        retries INTEGER DEFAULT 0,
        next_attempt_at TEXT,
        priority TEXT DEFAULT 'medium',
        idempotency_key TEXT UNIQUE,
        version INTEGER DEFAULT 1,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS runtime_diagnostics (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT,
        timestamp TEXT
      );
    `);
  }

  // Auto-save wrapper for database modifications
  async executeWrite(query: string, params?: any[]) {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    // Replace undefined with null in params, as sql.js does not accept undefined
    let safeParams: any[] = [];
    if (params) {
      safeParams = params.map(p => {
        if (p === undefined) return null;
        if (typeof p === 'boolean') return p ? 1 : 0;
        if (p instanceof Date) return p.toISOString();
        return p;
      });
    }

    try {
      this.db.run(query, safeParams);
      await this.save();
      
      // Notify sync store that changes happened
      useSyncStore.getState().setHasUnsyncedChanges(true);

      // Mutation Metadata for Eventual Consistency / Cloud Sync
      if (typeof window !== 'undefined') {
        const isMutation = query.trim().toUpperCase().match(/^(INSERT|UPDATE|DELETE)/);
        if (isMutation) {
          import('@/lib/sync/actionQueue').then(({ actionQueue }) => {
            let deviceId = localStorage.getItem('proforma_device_id');
            if (!deviceId) {
              deviceId = `dev_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
              localStorage.setItem('proforma_device_id', deviceId);
            }
            
            const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
              ? crypto.randomUUID() 
              : `op_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

            actionQueue.enqueue('SYNC_MUTATION', {
              operation_id: uuid,
              device_id: deviceId,
              timestamp: Date.now(),
              mutation_version: 1,
              query,
              params: safeParams
            }, 'MEDIUM');
          });
        }
      }
    } catch (error) {
      console.error("Execute write error:", error);
      throw error;
    }
  }

  // For read-only queries
  public async query(sql: string, params: any[] = []): Promise<any[]> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    const stmt = this.db.prepare(sql);
    const results = [];
    
    // Bind parameters if provided
    if (params && params.length > 0) {
      const safeParams = params.map(p => {
        if (p === undefined) return null;
        if (typeof p === 'boolean') return p ? 1 : 0;
        if (p instanceof Date) return p.toISOString();
        return p;
      });
      stmt.bind(safeParams);
    }
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  // --- RECOVERY PACK METHODS ---
  
  public async exportRawDatabase(): Promise<Uint8Array> {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");
    return this.db.export();
  }

  public async importRawDatabase(data: Uint8Array): Promise<void> {
    if (!this.idb) throw new Error("IndexedDB not initialized");
    // Save to IDB immediately, bypassing normal lifecycle
    await this.idb.put(STORE_NAME, data, this.fileKey);
    // Force re-init on next query
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
    await this.init();
  }
  // -----------------------------

  async getOne(query: string, params?: any[]) {
    const results = await this.query(query, params);
    return results.length > 0 ? results[0] : null;
  }

  private async save() {
    if (!this.db || !this.idb) return;
    const data = this.db.export();
    await this.idb.put(STORE_NAME, data, this.fileKey);
  }

  // Export DB for Google Drive backup
  async getDatabaseFile(): Promise<Uint8Array | null> {
    await this.init();
    if (!this.db) return null;
    return this.db.export();
  }

  // Import DB from Google Drive restore
  async restoreDatabaseFile(data: Uint8Array): Promise<void> {
    await this.init();
    
    // Close existing DB
    if (this.db) {
      this.db.close();
    }

    // Load new WASM DB
    const SQL = await initSqlJs({ locateFile: (file) => `/${file}` });
    this.db = new SQL.Database(data);
    
    // Save to IndexedDB
    await this.save();
  }

  // Wipes out the current tenant database for extreme tenant isolation
  async destroyTenantDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    if (this.idb) {
      await this.idb.delete(STORE_NAME, this.fileKey);
      this.isInitialized = false;
      this.initPromise = null;
    }
  }
}

import { createChaosAwareDbAdapter } from "../runtime/chaos/chaosDbAdapter";

const realDbClient = new DatabaseClient();
// Singleton instance, proxied by Chaos Adapter
export const dbClient = createChaosAwareDbAdapter(realDbClient);
