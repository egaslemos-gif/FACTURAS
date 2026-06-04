import { dbClient } from "../client";
import { ClientInteraction, InteractionType } from "../../types";
import { generateId, now } from "../../utils";

export const interactionsRepo = {
  async getByClientId(clientId: string): Promise<ClientInteraction[]> {
    const data = await dbClient.query(
      "SELECT * FROM client_interactions WHERE client_id = ? ORDER BY created_at DESC",
      [clientId]
    );
    return data as ClientInteraction[];
  },

  async getRecent(limit: number = 10): Promise<(ClientInteraction & { client_name?: string })[]> {
    const data = await dbClient.query(
      `SELECT ci.*, c.name as client_name 
       FROM client_interactions ci 
       LEFT JOIN clients c ON ci.client_id = c.id 
       ORDER BY ci.created_at DESC 
       LIMIT ?`,
      [limit]
    );
    return data as (ClientInteraction & { client_name?: string })[];
  },

  async create(
    clientId: string,
    type: InteractionType,
    title: string,
    description: string | null
  ): Promise<string> {
    const id = generateId();
    const timestamp = now();

    await dbClient.executeWrite(
      `INSERT INTO client_interactions (id, client_id, type, title, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, clientId, type, title, description, timestamp]
    );

    return id;
  },

  async delete(id: string): Promise<void> {
    await dbClient.executeWrite("DELETE FROM client_interactions WHERE id = ?", [id]);
  },

  async deleteByClientId(clientId: string): Promise<void> {
    await dbClient.executeWrite("DELETE FROM client_interactions WHERE client_id = ?", [clientId]);
  },
};
