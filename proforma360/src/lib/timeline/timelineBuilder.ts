import { dbClient } from "../db/client";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: "history" | "interaction" | "telemetry";
  action: string;
  title: string;
  details?: string | null;
  meta?: any;
}

export class TimelineBuilder {
  /**
   * Fetches and builds a consolidated, compressed timeline for a specific client
   */
  static async buildTimeline(clientId: string): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = [];

    // 1. Get client quotations and their history
    const quotations = await dbClient.query(
      "SELECT id, quotation_number FROM quotations WHERE client_id = ?",
      [clientId]
    );

    for (const q of quotations) {
      // Get history
      const history = await dbClient.query(
        "SELECT * FROM quotation_history WHERE quotation_id = ? ORDER BY created_at DESC",
        [q.id]
      );
      for (const h of history) {
        events.push({
          id: h.id || `h_${Date.now()}_${Math.random()}`,
          timestamp: h.created_at || new Date().toISOString(),
          type: "history",
          action: h.action,
          title: `Cotação ${q.quotation_number}: ${h.action}`,
          details: h.details || `Estado alterado de ${h.old_status || "n/a"} para ${h.new_status || "n/a"}`,
          meta: { quotationId: q.id, quotationNumber: q.quotation_number }
        });
      }

      // Get telemetry
      const telemetry = await dbClient.getOne(
        "SELECT views_count, downloads_count, last_viewed_at FROM proposal_telemetry WHERE quotation_id = ?",
        [q.id]
      );
      if (telemetry) {
        if (telemetry.views_count > 0) {
          events.push({
            id: `tel_view_${q.id}`,
            timestamp: telemetry.last_viewed_at || new Date().toISOString(),
            type: "telemetry",
            action: "PROPOSAL_VIEWED",
            title: `Cotação ${q.quotation_number} visualizada`,
            details: `Visualizada ${telemetry.views_count} vezes`,
            meta: { count: telemetry.views_count, type: "view", quotationId: q.id }
          });
        }
        if (telemetry.downloads_count > 0) {
          events.push({
            id: `tel_down_${q.id}`,
            timestamp: telemetry.last_viewed_at || new Date().toISOString(),
            type: "telemetry",
            action: "PDF_DOWNLOADED",
            title: `Cotação ${q.quotation_number} descarregada`,
            details: `Descarregada ${telemetry.downloads_count} vezes`,
            meta: { count: telemetry.downloads_count, type: "download", quotationId: q.id }
          });
        }
      }
    }

    // 2. Get client interactions
    const interactions = await dbClient.query(
      "SELECT * FROM client_interactions WHERE client_id = ? ORDER BY created_at DESC",
      [clientId]
    );
    for (const inter of interactions) {
      events.push({
        id: inter.id,
        timestamp: inter.created_at || new Date().toISOString(),
        type: "interaction",
        action: inter.type.toUpperCase(),
        title: inter.title,
        details: inter.description,
        meta: { type: inter.type }
      });
    }

    // Sort all events by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 3. Compress consecutive/repetitive events on the same day
    return this.compressEvents(events);
  }

  /**
   * Compresses consecutive identical events (like multiple views) within the same date
   */
  private static compressEvents(events: TimelineEvent[]): TimelineEvent[] {
    const compressed: TimelineEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const current = events[i];
      
      // If it is a telemetry event, check if we can group it with other telemetry events on the same date
      if (current.type === "telemetry") {
        const currentDateStr = new Date(current.timestamp).toDateString();
        const existingIndex = compressed.findIndex(
          (x) =>
            x.type === "telemetry" &&
            x.action === current.action &&
            x.meta?.quotationId === current.meta?.quotationId &&
            new Date(x.timestamp).toDateString() === currentDateStr
        );

        if (existingIndex > -1) {
          // Merge them
          const existing = compressed[existingIndex];
          const currentCount = current.meta?.count ?? 1;
          const existingCount = existing.meta?.count ?? 1;
          const newCount = existingCount + currentCount;
          existing.meta.count = newCount;
          existing.details = current.action === "PROPOSAL_VIEWED"
            ? `👁️ Cliente visualizou a proposta ${newCount} vezes`
            : `📥 Cliente descarregou o PDF ${newCount} vezes`;
          
          // Keep the latest timestamp
          if (new Date(current.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
            existing.timestamp = current.timestamp;
          }
          continue;
        }
      }
      
      compressed.push(current);
    }
    
    return compressed;
  }
}
