import fs from "fs";
import path from "path";

export interface UserSubscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  billingCycle: string;
  quotationLimit: number;
  quotationsUsed: number;
  clientLimit: number;
  clientsUsed: number;
  productLimit: number;
  productsUsed: number;
  startedAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
// Vercel serverless functions have a read-only filesystem except for /tmp
const DB_PATH = isVercel ? "/tmp/cloud_db.json" : path.join(process.cwd(), "cloud_db.json");

export interface DeviceSession {
  deviceId: string;
  lastActive: string;
  userAgent: string;
}

export interface OperationalLog {
  id: string;
  userId: string;
  eventType: string;
  details: string;
  timestamp: string;
}

export interface CloudDatabase {
  users: Record<string, {
    email: string;
    name: string;
    isAdmin: boolean;
  }>;
  subscriptions: Record<string, UserSubscription>;
  deviceSessions: Record<string, DeviceSession[]>;
  operationalLogs: OperationalLog[];
}

const DEFAULT_DB: CloudDatabase = {
  users: {
    "local-fallback": {
      email: "local-fallback",
      name: "Local Offline User",
      isAdmin: false
    }
  },
  subscriptions: {
    "local-fallback": {
      id: "sub_local",
      userId: "local-fallback",
      plan: "free",
      status: "active",
      billingCycle: "monthly",
      quotationLimit: 1,
      quotationsUsed: 0,
      clientLimit: 5,
      clientsUsed: 0,
      productLimit: 10,
      productsUsed: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  deviceSessions: {},
  operationalLogs: []
};

/**
 * Server-side persistent JSON database acting as the Supabase/PostgreSQL Cloud Control Plane registry.
 */
export class UserRegistry {
  private static inMemoryDb: CloudDatabase | null = null;

  private static readDB(): CloudDatabase {
    if (isVercel) {
      if (!this.inMemoryDb) {
        this.inMemoryDb = JSON.parse(JSON.stringify(DEFAULT_DB));
      }
      return this.inMemoryDb!;
    }

    try {
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2));
        return DEFAULT_DB;
      }
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("Failed to read cloud DB, returning default:", err);
      return DEFAULT_DB;
    }
  }

  private static writeDB(db: CloudDatabase): void {
    if (isVercel) {
      this.inMemoryDb = db;
      return;
    }

    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    } catch (err) {
      console.error("Failed to write to cloud DB:", err);
    }
  }

  static getSubscription(userId: string): UserSubscription {
    const db = this.readDB();
    
    // Auto-create default free subscription if missing
    if (!db.subscriptions[userId]) {
      db.subscriptions[userId] = {
        id: `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        plan: "free",
        status: "active",
        billingCycle: "monthly",
        quotationLimit: 1,
        quotationsUsed: 0,
        clientLimit: 5,
        clientsUsed: 0,
        productLimit: 10,
        productsUsed: 0,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (!db.users[userId]) {
        db.users[userId] = {
          email: userId,
          name: userId.split("@")[0] || "User",
          isAdmin: userId.includes("admin") || userId === "egaslemos.gif@gmail.com"
        };
      }
      
      this.writeDB(db);
    }

    return db.subscriptions[userId];
  }

  static updateSubscription(userId: string, data: Partial<UserSubscription>): UserSubscription {
    const db = this.readDB();
    const current = this.getSubscription(userId);
    
    const updated = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    db.subscriptions[userId] = updated;
    this.writeDB(db);
    
    this.logEvent(userId, "subscription_updated", `Plan changed or override applied: ${data.plan || ""}`);
    return updated;
  }

  static registerUser(userId: string, email: string, name: string): void {
    const db = this.readDB();
    db.users[userId] = {
      email,
      name,
      isAdmin: email.includes("admin") || email === "egaslemos.gif@gmail.com"
    };
    this.writeDB(db);
  }

  static getUserInfo(userId: string) {
    const db = this.readDB();
    return db.users[userId] || { email: userId, name: "Unknown", isAdmin: false };
  }

  static logEvent(userId: string, eventType: string, details: string): void {
    const db = this.readDB();
    const log: OperationalLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      eventType,
      details,
      timestamp: new Date().toISOString()
    };
    db.operationalLogs.unshift(log); // newest first
    // Cap logs at 1000 entries
    if (db.operationalLogs.length > 1000) {
      db.operationalLogs = db.operationalLogs.slice(0, 1000);
    }
    this.writeDB(db);
  }

  static getDeviceSessions(userId: string): DeviceSession[] {
    const db = this.readDB();
    return db.deviceSessions[userId] || [];
  }

  static trackDevice(userId: string, deviceId: string, userAgent: string): void {
    const db = this.readDB();
    if (!db.deviceSessions[userId]) {
      db.deviceSessions[userId] = [];
    }

    const sessions = db.deviceSessions[userId];
    const existingIndex = sessions.findIndex(s => s.deviceId === deviceId);

    if (existingIndex >= 0) {
      sessions[existingIndex].lastActive = new Date().toISOString();
      sessions[existingIndex].userAgent = userAgent;
    } else {
      sessions.push({
        deviceId,
        userAgent,
        lastActive: new Date().toISOString()
      });
    }

    this.writeDB(db);
  }

  static getAllUsers() {
    const db = this.readDB();
    return Object.keys(db.users).map(userId => {
      const info = db.users[userId];
      const sub = db.subscriptions[userId] || null;
      const sessions = db.deviceSessions[userId] || [];
      return {
        userId,
        email: info.email,
        name: info.name,
        isAdmin: info.isAdmin,
        subscription: sub,
        deviceSessionsCount: sessions.length,
        lastActive: sessions.length > 0 ? sessions.sort((a,b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())[0].lastActive : null
      };
    });
  }

  static getAllLogs(): OperationalLog[] {
    const db = this.readDB();
    return db.operationalLogs;
  }
}
