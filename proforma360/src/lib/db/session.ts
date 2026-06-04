import { openDB } from "idb";

const DB_NAME = "proforma360_session_db";
const STORE_NAME = "sessions";
const SESSION_KEY = "current_session";

export async function saveOfflineSession(sessionData: any) {
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    await db.put(STORE_NAME, sessionData, SESSION_KEY);
  } catch (error) {
    console.error("Failed to save offline session:", error);
  }
}

export async function getOfflineSession() {
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
    return await db.get(STORE_NAME, SESSION_KEY);
  } catch (error) {
    console.error("Failed to get offline session:", error);
    return null;
  }
}

export async function clearOfflineSession() {
  try {
    const db = await openDB(DB_NAME, 1);
    await db.delete(STORE_NAME, SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear offline session:", error);
  }
}
