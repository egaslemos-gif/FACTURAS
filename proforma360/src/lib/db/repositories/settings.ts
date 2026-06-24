import { dbClient } from "../client";

export const settingsRepo = {
  async get(key: string): Promise<string | null> {
    const data = await dbClient.getOne("SELECT value FROM settings WHERE key = ?", [key]) as any;
    return data ? data.value : null;
  },

  async set(key: string, value: string): Promise<void> {
    await dbClient.executeWrite(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value]
    );
  },
  
  async getAll(): Promise<Record<string, string>> {
    const data = await dbClient.query("SELECT * FROM settings") as any[];
    const result: Record<string, string> = {};
    if (data) {
      data.forEach(row => {
        result[row.key] = row.value;
      });
    }
    return result;
  }
};
