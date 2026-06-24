import { dbClient } from "../db/client";

export interface SyncStatus {
  status: "synced" | "pending" | "failed" | null;
  lastSyncAt: string | null;
  externalEventId: string | null;
  syncError: string | null;
}

export interface CalendarEventDetails {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string | null;
  clientName: string;
  quotationNumber: string;
}

export interface CalendarProvider {
  name: "google" | "outlook";
  authorize(): Promise<boolean>;
  revoke(): Promise<void>;
  syncEvent(event: CalendarEventDetails): Promise<{ externalEventId: string; syncStatus: "synced" | "failed"; error?: string }>;
}

/**
 * Mock Google Calendar Provider
 */
export class GoogleCalendarProvider implements CalendarProvider {
  name = "google" as const;

  async authorize(): Promise<boolean> {
    console.log("Authorizing with Google Calendar OAuth2...");
    // Simulate OAuth consent screen redirect/popup delay
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem("google_calendar_linked", "true");
    return true;
  }

  async revoke(): Promise<void> {
    console.log("Revoking Google Calendar authorization...");
    localStorage.removeItem("google_calendar_linked");
  }

  async syncEvent(event: CalendarEventDetails): Promise<{ externalEventId: string; syncStatus: "synced" | "failed"; error?: string }> {
    console.log(`Syncing event "${event.title}" to Google Calendar...`);
    // Simulated API call
    await new Promise((r) => setTimeout(r, 500));
    
    // In a real implementation this would perform an HTTP request to the Google Calendar API
    const externalEventId = `g_evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      externalEventId,
      syncStatus: "synced"
    };
  }
}

/**
 * Mock Outlook / Microsoft Graph Calendar Provider
 */
export class OutlookCalendarProvider implements CalendarProvider {
  name = "outlook" as const;

  async authorize(): Promise<boolean> {
    console.log("Authorizing with Microsoft Graph OAuth2...");
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem("outlook_calendar_linked", "true");
    return true;
  }

  async revoke(): Promise<void> {
    console.log("Revoking Outlook Calendar authorization...");
    localStorage.removeItem("outlook_calendar_linked");
  }

  async syncEvent(event: CalendarEventDetails): Promise<{ externalEventId: string; syncStatus: "synced" | "failed"; error?: string }> {
    console.log(`Syncing event "${event.title}" to Outlook Calendar...`);
    await new Promise((r) => setTimeout(r, 500));

    const externalEventId = `o_evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      externalEventId,
      syncStatus: "synced"
    };
  }
}

/**
 * Global Calendar Sync Orchestrator
 */
export class CalendarSyncOrchestrator {
  private static providers: Record<"google" | "outlook", CalendarProvider> = {
    google: new GoogleCalendarProvider(),
    outlook: new OutlookCalendarProvider(),
  };

  /**
   * Sync a quotation's commercial follow-up to the connected calendar
   */
  static async syncQuotationAction(quotationId: string): Promise<void> {
    // 1. Fetch quotation and client info
    const query = `
      SELECT q.*, c.name as client_name 
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.id = ?
    `;
    const quotation = await dbClient.getOne(query, [quotationId]);
    if (!quotation) return;

    // 2. Check if sync is enabled
    if (!quotation.calendar_sync_enabled || !quotation.external_calendar_provider) {
      return;
    }

    const providerName = quotation.external_calendar_provider as "google" | "outlook";
    const provider = this.providers[providerName];
    if (!provider) return;

    const eventDetails: CalendarEventDetails = {
      id: quotation.id,
      title: `${quotation.next_action || "Ação Comercial"} - PF360`,
      description: `Proforma: ${quotation.quotation_number}\nCliente: ${quotation.client_name || "Desconhecido"}\nAção: ${quotation.next_action || ""}`,
      date: quotation.next_action_date || "",
      time: quotation.next_action_time || null,
      clientName: quotation.client_name || "Desconhecido",
      quotationNumber: quotation.quotation_number
    };

    try {
      // Update status to pending before sync
      await dbClient.executeWrite(
        `UPDATE quotations 
         SET calendar_sync_status = 'pending',
             calendar_sync_error = NULL
         WHERE id = ?`,
        [quotationId]
      );

      const result = await provider.syncEvent(eventDetails);
      const now = new Date().toISOString();

      // Save sync status to database
      await dbClient.executeWrite(
        `UPDATE quotations 
         SET calendar_sync_status = ?,
             calendar_sync_date = ?,
             external_calendar_event_id = ?,
             calendar_sync_error = ?
         WHERE id = ?`,
        [
          result.syncStatus,
          now,
          result.externalEventId,
          result.error || null,
          quotationId
        ]
      );
      
      console.log(`Sync status for ${quotationId} updated to: ${result.syncStatus}`);
    } catch (err: any) {
      const errorMsg = err?.message || "Erro desconhecido na sincronização";
      await dbClient.executeWrite(
        `UPDATE quotations 
         SET calendar_sync_status = 'failed',
             calendar_sync_error = ?
         WHERE id = ?`,
        [errorMsg, quotationId]
      );
    }
  }
}
