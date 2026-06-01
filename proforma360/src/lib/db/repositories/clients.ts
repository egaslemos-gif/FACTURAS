import { dbClient } from "../client";
import { Client } from "../../types";
import { generateId, now } from "../../utils";

export const clientsRepo = {
  async getAll(): Promise<Client[]> {
    const data = await dbClient.query("SELECT * FROM clients ORDER BY name ASC");
    return data as Client[];
  },

  async getById(id: string): Promise<Client | null> {
    const data = await dbClient.getOne("SELECT * FROM clients WHERE id = ?", [id]);
    return data as Client | null;
  },

  async create(clientData: Omit<Client, "id" | "created_at" | "updated_at">): Promise<Client> {
    const timestamp = now();
    const newClient = {
      id: generateId(),
      ...clientData,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const keys = Object.keys(newClient).join(", ");
    const placeholders = Object.keys(newClient).fill("?").join(", ");
    const values = Object.values(newClient);

    const query = `INSERT INTO clients (${keys}) VALUES (${placeholders})`;
    await dbClient.executeWrite(query, values);

    return newClient as Client;
  },

  async update(id: string, clientData: Partial<Client>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    const timestamp = now();

    Object.entries(clientData).forEach(([key, value]) => {
      if (key !== "id" && key !== "created_at" && key !== "updated_at") {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    updates.push("updated_at = ?");
    values.push(timestamp);
    values.push(id);

    const query = `UPDATE clients SET ${updates.join(", ")} WHERE id = ?`;
    await dbClient.executeWrite(query, values);
  },

  async delete(id: string): Promise<void> {
    await dbClient.executeWrite("DELETE FROM clients WHERE id = ?", [id]);
  },
};
