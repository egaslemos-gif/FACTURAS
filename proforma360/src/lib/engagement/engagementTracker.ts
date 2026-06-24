import { dbClient } from "../db/client";
import { Quotation } from "../types";

export interface EngagementMetrics {
  viewsCount: number;
  lastViewedAt: string | null;
  downloadsCount: number;
  daysSinceLastActivity: number;
  inactivityWarning: boolean;
  statusLabel: string;
}

/**
 * Client engagement analysis based on local SQLite metrics & quotation dates.
 */
export class EngagementTracker {
  
  /**
   * Tracks proposal views in SQLite proposal_telemetry table
   */
  static async trackView(quotationId: string): Promise<void> {
    try {
      const existing = await dbClient.getOne(
        "SELECT views_count FROM proposal_telemetry WHERE quotation_id = ?",
        [quotationId]
      );
      
      const now = new Date().toISOString();
      if (existing) {
        await dbClient.executeWrite(
          "UPDATE proposal_telemetry SET views_count = views_count + 1, last_viewed_at = ? WHERE quotation_id = ?",
          [now, quotationId]
        );
      } else {
        await dbClient.executeWrite(
          "INSERT INTO proposal_telemetry (quotation_id, views_count, downloads_count, last_viewed_at) VALUES (?, 1, 0, ?)",
          [quotationId, now]
        );
      }
    } catch (e) {
      console.error("[EngagementTracker] trackView error:", e);
    }
  }

  /**
   * Tracks PDF downloads in SQLite proposal_telemetry table
   */
  static async trackDownload(quotationId: string): Promise<void> {
    try {
      const existing = await dbClient.getOne(
        "SELECT downloads_count FROM proposal_telemetry WHERE quotation_id = ?",
        [quotationId]
      );
      
      if (existing) {
        await dbClient.executeWrite(
          "UPDATE proposal_telemetry SET downloads_count = downloads_count + 1 WHERE quotation_id = ?",
          [quotationId]
        );
      } else {
        await dbClient.executeWrite(
          "INSERT INTO proposal_telemetry (quotation_id, views_count, downloads_count, last_viewed_at) VALUES (?, 0, 1, ?)",
          [quotationId, new Date().toISOString()]
        );
      }
    } catch (e) {
      console.error("[EngagementTracker] trackDownload error:", e);
    }
  }

  /**
   * Returns calculated metrics for a single quotation
   */
  static async getMetrics(quotation: Quotation): Promise<EngagementMetrics> {
    let views = 0;
    let downloads = 0;
    let lastView: string | null = null;

    try {
      const row = await dbClient.getOne(
        "SELECT views_count, downloads_count, last_viewed_at FROM proposal_telemetry WHERE quotation_id = ?",
        [quotation.id]
      );
      if (row) {
        views = row.views_count ?? 0;
        downloads = row.downloads_count ?? 0;
        lastView = row.last_viewed_at ?? null;
      }
    } catch (e) {
      console.error("[EngagementTracker] getMetrics error:", e);
    }

    const lastActivityDate = quotation.last_activity_at || quotation.updated_at || quotation.created_at;
    const diffMs = Date.now() - new Date(lastActivityDate).getTime();
    const daysSinceLastActivity = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    const inactivityWarning = daysSinceLastActivity >= 6;

    let statusLabel = "Normal";
    if (views >= 5) {
      statusLabel = "🔥 Super Interessado";
    } else if (inactivityWarning) {
      statusLabel = "⚠️ Risco de Perda";
    } else if (views > 0) {
      statusLabel = "👁️ Proposta Visualizada";
    }

    return {
      viewsCount: views,
      lastViewedAt: lastView,
      downloadsCount: downloads,
      daysSinceLastActivity,
      inactivityWarning,
      statusLabel
    };
  }
}
