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
      last_activity_at: timestamp,
      reminders_enabled: 1,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const { DocumentSignature } = await import("../../documents/documentSignature");
    const signatures = await DocumentSignature.generateSignatures(newQuotation as unknown as Quotation);
    
    newQuotation.semantic_schema_signature = signatures.semantic_schema_signature;
    newQuotation.execution_plan_signature = signatures.execution_plan_signature;
    newQuotation.totals_ast_signature = signatures.totals_ast_signature;

    const keys = Object.keys(newQuotation).join(", ");
    const placeholders = Object.keys(newQuotation).fill("?").join(", ");
    const values = Object.values(newQuotation);

    const { RuntimeConsistencyCheckpoint } = await import("../../runtime/runtimeConsistencyCheckpoint");
    await RuntimeConsistencyCheckpoint.validateBeforeSave(newQuotation as unknown as Quotation);

    const { RuntimeReplayReceipt } = await import("../../runtime/runtimeReplayReceipt");
    await RuntimeReplayReceipt.logExecutionReceipt(quotationId, signatures);

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
    
    // Recalculate signatures using current state merged with updates
    const currentQData = await dbClient.getOne("SELECT * FROM quotations WHERE id = ?", [id]);
    if (currentQData) {
      const mergedQuotation = { ...currentQData, ...quotationData };
      const { DocumentSignature } = await import("../../documents/documentSignature");
      const signatures = await DocumentSignature.generateSignatures(mergedQuotation as unknown as Quotation);
      quotationData.semantic_schema_signature = signatures.semantic_schema_signature;
      quotationData.execution_plan_signature = signatures.execution_plan_signature;
      quotationData.totals_ast_signature = signatures.totals_ast_signature;
    }

    // Update Quotation
    if (Object.keys(quotationData).length > 0) {
      const { RuntimeConsistencyCheckpoint } = await import("../../runtime/runtimeConsistencyCheckpoint");
      const currentSnapshot = await dbClient.getOne("SELECT * FROM quotations WHERE id = ?", [id]);
      await RuntimeConsistencyCheckpoint.validateBeforeSave({ ...currentSnapshot, ...quotationData } as unknown as Quotation);

      const updates: string[] = [];
      const values: any[] = [];

      Object.entries(quotationData).forEach(([key, value]) => {
        if (key !== "id" && key !== "created_at" && key !== "updated_at" && key !== "client_name") {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });

      updates.push("last_activity_at = ?");
      values.push(timestamp);
      updates.push("updated_at = ?");
      values.push(timestamp);
      values.push(id);

      await dbClient.executeWrite(`UPDATE quotations SET ${updates.join(", ")} WHERE id = ?`, values);

      if (quotationData.semantic_schema_signature) {
        const { RuntimeReplayReceipt } = await import("../../runtime/runtimeReplayReceipt");
        await RuntimeReplayReceipt.logExecutionReceipt(id, {
          semantic_schema_signature: quotationData.semantic_schema_signature as string,
          execution_plan_signature: quotationData.execution_plan_signature as string,
          totals_ast_signature: quotationData.totals_ast_signature as string,
        });
      }
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

    await dbClient.executeWrite("UPDATE quotations SET status = ?, last_activity_at = ?, updated_at = ? WHERE id = ?", [newStatus, now(), now(), id]);
    await this.addHistory(id, "Status Change", q.quotation.status, newStatus, actionDetails);
  },

  async markAsSent(id: string): Promise<void> {
    const q = await this.getById(id);
    if (!q) return;

    const timestamp = now();
    await dbClient.executeWrite("UPDATE quotations SET status = 'sent', sent_at = ?, last_contact_at = ?, last_activity_at = ?, updated_at = ? WHERE id = ?", [timestamp, timestamp, timestamp, timestamp, id]);
    await this.addHistory(id, "Shared", q.quotation.status, "sent", "Proforma partilhada com o cliente");
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
  },

  async updatePipelineStage(id: string, newStage: string): Promise<void> {
    const q = await this.getById(id);
    if (!q) return;

    const oldStage = q.quotation.pipeline_stage || "lead";
    await dbClient.executeWrite(
      "UPDATE quotations SET pipeline_stage = ?, last_activity_at = ?, updated_at = ? WHERE id = ?",
      [newStage, now(), now(), id]
    );
    await this.addHistory(id, "Pipeline", oldStage, newStage, `Movido para ${newStage}`);
  },

  async setNextAction(id: string, action: string | null, date: string | null): Promise<void> {
    await dbClient.executeWrite(
      "UPDATE quotations SET next_action = ?, next_action_date = ?, next_action_time = ?, last_activity_at = ?, updated_at = ? WHERE id = ?",
      [action, date, null, now(), now(), id]
    );
  },

  async setNextActionFull(id: string, action: string | null, date: string | null, time: string | null, reminders: boolean): Promise<void> {
    await dbClient.executeWrite(
      "UPDATE quotations SET next_action = ?, next_action_date = ?, next_action_time = ?, reminders_enabled = ?, last_activity_at = ?, updated_at = ? WHERE id = ?",
      [action, date, time, reminders ? 1 : 0, now(), now(), id]
    );
  },

  async setPriority(id: string, priority: "low" | "medium" | "high"): Promise<void> {
    await dbClient.executeWrite(
      "UPDATE quotations SET priority = ?, last_activity_at = ?, updated_at = ? WHERE id = ?",
      [priority, now(), now(), id]
    );
  },

  async getCommercialProposal(quotationId: string): Promise<any> {
    const row = await dbClient.getOne("SELECT * FROM commercial_proposals WHERE quotation_id = ?", [quotationId]);
    return row;
  },

  async listCommercialProposals(): Promise<Array<{
    id: string;
    quotation_id: string;
    title: string;
    content: string;
    status: string;
    created_at: string;
    updated_at: string;
    quotation_number: string;
    grand_total: number;
    client_name: string | null;
  }>> {
    const rows = await dbClient.query(`
      SELECT cp.*, q.quotation_number, q.grand_total, c.name as client_name
      FROM commercial_proposals cp
      JOIN quotations q ON cp.quotation_id = q.id
      LEFT JOIN clients c ON q.client_id = c.id
      ORDER BY cp.updated_at DESC
    `);
    return rows as Array<{
      id: string;
      quotation_id: string;
      title: string;
      content: string;
      status: string;
      created_at: string;
      updated_at: string;
      quotation_number: string;
      grand_total: number;
      client_name: string | null;
    }>;
  },

  async deleteCommercialProposal(quotationId: string): Promise<void> {
    await dbClient.executeWrite("DELETE FROM commercial_proposals WHERE quotation_id = ?", [quotationId]);
  },

  async saveCommercialProposal(quotationId: string, title: string, content: string, status: string): Promise<void> {
    const existing = await this.getCommercialProposal(quotationId);
    if (existing) {
      await dbClient.executeWrite(
        "UPDATE commercial_proposals SET title = ?, content = ?, status = ?, updated_at = ? WHERE quotation_id = ?",
        [title, content, status, now(), quotationId]
      );
    } else {
      await dbClient.executeWrite(
        "INSERT INTO commercial_proposals (id, quotation_id, title, content, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [generateId(), quotationId, title, content, status, now(), now()]
      );
    }
  }
};
