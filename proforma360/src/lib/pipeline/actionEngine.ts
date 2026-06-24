import { dbClient } from "@/lib/db/client";
import { Quotation } from "@/lib/types";

export type PipelineEventType = 
  | "FOLLOWUP_COMPLETED" 
  | "ACTION_RESCHEDULED" 
  | "ACTION_OVERDUE" 
  | "PIPELINE_STALE" 
  | "ACTION_CREATED";

export interface PipelineEvent {
  type: PipelineEventType;
  quotationId: string;
  userId?: string;
  details?: string;
  timestamp: string;
}

/**
 * Event-Driven Action Engine
 * Central runtime for commercial tasks, follow-up state changes, and history logging.
 */
export class ActionEngine {
  
  /**
   * Log an operational event into the quotation history (Activity Log / Timeline)
   */
  static async logEvent(event: PipelineEvent): Promise<void> {
    const historyId = `hist_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const details = event.details || "";
    
    // We reuse the existing quotation_history schema to build the operational timeline
    await dbClient.executeWrite(
      `INSERT INTO quotation_history (id, quotation_id, action, old_status, new_status, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        event.quotationId,
        event.type,
        null, // old_status (repurposed / optional)
        null, // new_status (repurposed / optional)
        details,
        event.timestamp
      ]
    );
  }

  /**
   * Mark the current scheduled action as completed
   */
  static async completeAction(quotationId: string): Promise<void> {
    const now = new Date().toISOString();
    
    // Fetch quotation to retrieve current action info for the log
    const quotation = await dbClient.getOne(
      "SELECT next_action, next_action_date, next_action_time FROM quotations WHERE id = ?",
      [quotationId]
    ) as Quotation | null;

    const actionText = quotation ? `${quotation.next_action || "Ação"} agendada para ${quotation.next_action_date || ""} ${quotation.next_action_time || ""}` : "Ação comercial";

    await dbClient.executeWrite(
      `UPDATE quotations 
       SET followup_status = 'completed',
           completed_at = ?,
           last_activity_at = ?,
           last_contact_at = ?
       WHERE id = ?`,
      [now, now, now, quotationId]
    );

    await this.logEvent({
      type: "FOLLOWUP_COMPLETED",
      quotationId,
      details: `Concluído: ${actionText}`,
      timestamp: now
    });
  }

  /**
   * Schedule a new action or reschedule an existing action
   */
  static async rescheduleAction(
    quotationId: string, 
    actionName: string, 
    dateStr: string, 
    timeStr: string, 
    priority: "low" | "medium" | "high" | "urgent" = "medium"
  ): Promise<void> {
    const now = new Date().toISOString();

    await dbClient.executeWrite(
      `UPDATE quotations 
       SET next_action = ?,
           next_action_date = ?,
           next_action_time = ?,
           priority = ?,
           followup_status = 'scheduled',
           completed_at = NULL,
           last_activity_at = ?
       WHERE id = ?`,
      [actionName, dateStr, timeStr, priority, now, quotationId]
    );

    await this.logEvent({
      type: "ACTION_RESCHEDULED",
      quotationId,
      details: `Reagendado: "${actionName}" para dia ${dateStr} às ${timeStr} (${priority})`,
      timestamp: now
    });
  }

  /**
   * Calculate date & time based on a preset
   */
  static parsePreset(preset: "30m" | "tomorrow_9h" | "end_of_day" | "next_monday" | "next_week"): { dateStr: string; timeStr: string } {
    const now = new Date();
    let target = new Date(now.getTime());

    switch (preset) {
      case "30m":
        target = new Date(now.getTime() + 30 * 60 * 1000);
        break;
      case "tomorrow_9h":
        target.setDate(now.getDate() + 1);
        target.setHours(9, 0, 0, 0);
        break;
      case "end_of_day":
        target.setHours(18, 0, 0, 0);
        break;
      case "next_monday":
        // Find next monday
        const day = target.getDay();
        const diff = (day === 0 ? 1 : 8 - day); // days to next monday
        target.setDate(target.getDate() + diff);
        target.setHours(9, 0, 0, 0);
        break;
      case "next_week":
        target.setDate(now.getDate() + 7);
        target.setHours(9, 0, 0, 0);
        break;
    }

    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
    const timeStr = `${pad(target.getHours())}:${pad(target.getMinutes())}`;
    return { dateStr, timeStr };
  }

  /**
   * Snooze / Quick reschedule using a smart preset
   */
  static async snoozeAction(quotationId: string, preset: "30m" | "tomorrow_9h" | "end_of_day" | "next_monday" | "next_week"): Promise<{ dateStr: string; timeStr: string }> {
    const now = new Date().toISOString();
    const { dateStr, timeStr } = this.parsePreset(preset);

    // Fetch existing action details
    const quotation = await dbClient.getOne(
      "SELECT next_action, priority FROM quotations WHERE id = ?",
      [quotationId]
    ) as Quotation | null;

    const actionName = quotation?.next_action || "Ligar ao cliente";
    const priority = quotation?.priority || "medium";

    await dbClient.executeWrite(
      `UPDATE quotations 
       SET next_action_date = ?,
           next_action_time = ?,
           followup_status = 'scheduled',
           completed_at = NULL,
           last_activity_at = ?
       WHERE id = ?`,
      [dateStr, timeStr, now, quotationId]
    );

    await this.logEvent({
      type: "ACTION_RESCHEDULED",
      quotationId,
      details: `Snooze (+${preset}): "${actionName}" adiado para ${dateStr} às ${timeStr}`,
      timestamp: now
    });

    return { dateStr, timeStr };
  }
}
