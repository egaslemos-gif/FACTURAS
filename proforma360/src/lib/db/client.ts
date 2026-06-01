import initSqlJs, { Database } from "sql.js";

// Import IndexedDB wrapper to persist the SQLite file in browser
import { openDB, IDBPDatabase } from "idb";
import { useSyncStore } from "@/stores/sync";

const DB_NAME = "proforma360_db";
const STORE_NAME = "sqlite_file";
const FILE_KEY = "database.sqlite";

class DatabaseClient {
  private db: Database | null = null;
  private idb: IDBPDatabase | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

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
      this.idb = await openDB(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });

      // 2. Load sql.js WASM
      const SQL = await initSqlJs({
        // Since we are in Next.js, we need to load the wasm file from public folder
        // We will copy sql-wasm.wasm to public/ later
        locateFile: (file) => `/${file}`,
      });

      // 3. Try to load existing database from IndexedDB
      const savedData = await this.idb.get(STORE_NAME, FILE_KEY);

      if (savedData) {
        // Load existing
        this.db = new SQL.Database(savedData);
        console.log("Database loaded from IndexedDB.");
        
        // Run migrations for existing DBs
        try {
          this.db.run("ALTER TABLE companies ADD COLUMN pdf_template TEXT DEFAULT 'classic'");
          await this.save();
        } catch (e) {
          // Column might already exist, ignore
        }
      } else {
        // Create new
        this.db = new SQL.Database();
        this.createSchema();
        await this.save();
        console.log("New database created and saved.");
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
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
        pdf_template TEXT DEFAULT 'classic',
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
        date TEXT,
        expiry_date TEXT,
        status TEXT DEFAULT 'draft',
        subtotal REAL,
        discount REAL DEFAULT 0,
        discount_type TEXT DEFAULT 'percentage',
        vat_total REAL,
        grand_total REAL,
        notes TEXT,
        terms TEXT,
        pdf_url TEXT,
        pdf_drive_id TEXT,
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
    `);
  }

  // Auto-save wrapper for database modifications
  async executeWrite(query: string, params?: any[]) {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    try {
      this.db.run(query, params);
      await this.save();
      
      // Notify sync store that changes happened
      useSyncStore.getState().setHasUnsyncedChanges(true);
    } catch (error) {
      console.error("Execute write error:", error);
      throw error;
    }
  }

  // For read-only queries
  async query(query: string, params?: any[]) {
    await this.init();
    if (!this.db) throw new Error("Database not initialized");

    try {
      const stmt = this.db.prepare(query);
      if (params) {
        stmt.bind(params);
      }

      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  }

  async getOne(query: string, params?: any[]) {
    const results = await this.query(query, params);
    return results.length > 0 ? results[0] : null;
  }

  private async save() {
    if (!this.db || !this.idb) return;
    const data = this.db.export();
    await this.idb.put(STORE_NAME, data, FILE_KEY);
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
}

// Singleton instance
export const dbClient = new DatabaseClient();
