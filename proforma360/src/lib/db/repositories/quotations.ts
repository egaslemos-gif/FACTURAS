import { dbClient } from "../client";
import { Quotation, QuotationItem, QuotationHistory } from "../../types";
import { generateId, now } from "../../utils";

export const quotationsRepo = {
  async getAll(): Promise<Quotation[]> {
    // Join with clients to get the client name
    const data = await dbClient.query(`
      SELECT q.*, c.name as client_name 
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id 
      ORDER BY q.created_at DESC
    `);
    return data as Quotation[];
  },

  async getById(id: string): Promise<{ quotation: Quotation; items: QuotationItem[]; history: QuotationHistory[] } | null> {
    const quotationData = await dbClient.getOne(`
      SELECT q.*, c.name as client_name 
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id 
      WHERE q.id = ?
    `, [id]);

    if (!quotationData) return null;

    const items = await dbClient.query("SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY sort_order ASC", [id]);
    const history = await dbClient.query("SELECT * FROM quotation_history WHERE quotation_id = ? ORDER BY created_at DESC", [id]);

    return {
      quotation: quotationData as Quotation,
      items: items as QuotationItem[],
      history: history as QuotationHistory[],
    };
  },

  async create(
    quotationData: Omit<Quotation, "id" | "created_at" | "updated_at" | "client_name">,
    items: Omit<QuotationItem, "id" | "quotation_id">[]
  ): Promise<string> {
    const timestamp = now();
    const quotationId = generateId();

    const newQuotation = {
      id: quotationId,
      ...quotationData,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const keys = Object.keys(newQuotation).join(", ");
    const placeholders = Object.keys(newQuotation).fill("?").join(", ");
    const values = Object.values(newQuotation);

    // Use transaction-like behavior by building a block of queries
    // Since sql.js allows multiple statements separated by ;, but bind parameters might be tricky for batch
    // We will do them sequentially using executeWrite

    await dbClient.executeWrite(`INSERT INTO quotations (${keys}) VALUES (${placeholders})`, values);

    // Insert Items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const newItem = {
        id: generateId(),
        quotation_id: quotationId,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        total: item.total,
        sort_order: i,
      };

      const iKeys = Object.keys(newItem).join(", ");
      const iPlaceholders = Object.keys(newItem).fill("?").join(", ");
      const iValues = Object.values(newItem);

      await dbClient.executeWrite(`INSERT INTO quotation_items (${iKeys}) VALUES (${iPlaceholders})`, iValues);
    }

    // Add history
    await this.addHistory(quotationId, "Created", null, "draft", "Quotation created");

    return quotationId;
  },

  async update(
    id: string,
    quotationData: Partial<Quotation>,
    items?: Omit<QuotationItem, "id" | "quotation_id">[]
  ): Promise<void> {
    const timestamp = now();
    
    // Update Quotation
    if (Object.keys(quotationData).length > 0) {
      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(quotationData).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at" && key !== "client_name") {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      updates.push("updated_at = ?");
      values.push(timestamp);
      values.push(id);

      await dbClient.executeWrite(`UPDATE quotations SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    // Update Items (delete all and re-insert)
    if (items) {
      await dbClient.executeWrite("DELETE FROM quotation_items WHERE quotation_id = ?", [id]);
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const newItem = {
          id: generateId(),
          quotation_id: id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          total: item.total,
          sort_order: i,
        };

        const iKeys = Object.keys(newItem).join(", ");
        const iPlaceholders = Object.keys(newItem).fill("?").join(", ");
        const iValues = Object.values(newItem);

        await dbClient.executeWrite(`INSERT INTO quotation_items (${iKeys}) VALUES (${iPlaceholders})`, iValues);
      }
    }
  },

  async updateStatus(id: string, newStatus: string, actionDetails: string): Promise<void> {
    const q = await this.getById(id);
    if (!q) return;

    await dbClient.executeWrite("UPDATE quotations SET status = ?, updated_at = ? WHERE id = ?", [newStatus, now(), id]);
    await this.addHistory(id, "Status Change", q.quotation.status, newStatus, actionDetails);
  },

  async delete(id: string): Promise<void> {
    await dbClient.executeWrite("DELETE FROM quotation_items WHERE quotation_id = ?", [id]);
    await dbClient.executeWrite("DELETE FROM quotation_history WHERE quotation_id = ?", [id]);
    await dbClient.executeWrite("DELETE FROM quotations WHERE id = ?", [id]);
  },

  async addHistory(quotationId: string, action: string, oldStatus: string | null, newStatus: string | null, details: string | null): Promise<void> {
    const history = {
      id: generateId(),
      quotation_id: quotationId,
      action,
      old_status: oldStatus,
      new_status: newStatus,
      details,
      created_at: now()
    };
    
    const keys = Object.keys(history).join(", ");
    const placeholders = Object.keys(history).fill("?").join(", ");
    const values = Object.values(history);

    await dbClient.executeWrite(`INSERT INTO quotation_history (${keys}) VALUES (${placeholders})`, values);
  }
};
